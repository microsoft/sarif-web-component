// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {observable, autorun, computed, observe, untracked} from 'mobx'
import {Run, Result, Artifact} from 'sarif'

import {MobxFilter} from './FilterBar'
import {PipelineContext} from './PipelineContext'
import {tryOr} from './try'
import {Rule, ResultOrRuleOrMore} from './Viewer.Types'

import {SortOrder} from 'azure-devops-ui/Table'
import {ITreeItem} from 'azure-devops-ui/Utilities/TreeItemProvider'

export enum SortRuleBy { Count, Name }

export const isMatch = (field: string, keywords: string[]) => !keywords.length || keywords.some(keyword => field.includes(keyword))

export class RunStore {
	driverName: string
	@observable sortRuleBy = SortRuleBy.Count
	@observable sortColumnIndex = 1
	@observable sortOrder = SortOrder.ascending
	private rulesInUse: Map<string, Rule>

	constructor(readonly run: Run, readonly logIndex, readonly filter: MobxFilter, readonly pipeline?: PipelineContext, readonly hideBaseline?: boolean) {
		const {driver} = run.tool
		const rules = driver.rules || []
		this.driverName = run.properties && run.properties['logFileName'] || driver.name.replace(/^Microsoft.CodeAnalysis.Sarif.PatternMatcher$/, 'CredScan on Push')
		
		if (!hideBaseline) {
			this.columns.push({
				id: 'Baseline',
				filterString: (result: Result) => result.baselineState as string || 'new',
				sortString:   (result: Result) => result.baselineState as string || 'new',
			})
		}

		const hasWorkItemUris = run.results && run.results.some(result => result.workItemUris && !!result.workItemUris.length)
		if (hasWorkItemUris) {
			this.columns.push({
				id: 'Bug',
				filterString: (result: Result) => '',
				sortString:   (result: Result) => '',
			})
		}

		const rulesListed = new Map<string, Rule>(rules.map(rule => [rule.id, rule] as any)) // Unable to express [[string, RuleEx]].
		this.rulesInUse = new Map<string, Rule>()

		run.results?.forEach(result => {
			const {ruleIndex} = result
			const ruleId = result.ruleId?.split('/')[0] ?? '(No Rule)' // 3.5.4 Hierarchical strings.
			if (!this.rulesInUse.has(ruleId)) {
				// Need to generate rules for some like Microsoft.CodeAnalysis.Sarif.PatternMatcher.
				const rule = rulesListed.get(ruleId) || ruleIndex !== undefined && rules[ruleIndex] as Rule || { id: ruleId } as Rule
				rule.isRule = true
				rule.run = run // For taxa.
				this.rulesInUse.set(ruleId, rule)
			}

			const rule = this.rulesInUse.get(ruleId)
			rule.results = rule.results || []
			rule.results.push(result)

			// Fill-in url from run.artifacts as needed.
			const artLoc = tryOr(() => result.locations[0].physicalLocation.artifactLocation)
			if (artLoc && artLoc.uri === undefined) {
				const art = tryOr<Artifact>(() => run.artifacts[artLoc.index])
				artLoc.uri = art.location.uri
			}

			result.run = run // For result renderer to get to run.artifacts.
		})

		autorun(() => {
			this.showAllRevision // Read.
			const rules = this.rulesFiltered.slice() // Slice to satisfy ref rulesTruncated.

			rules.forEach(ruleTreeItem => {
				const maxLength = 3
				ruleTreeItem.childItems = !ruleTreeItem.isShowAll && ruleTreeItem.childItemsAll.length > maxLength
					? [
						...ruleTreeItem.childItemsAll.slice(0, maxLength),
						{ data: { onClick: () => {
							ruleTreeItem.isShowAll = true
							this.showAllRevision++
						}}}
					]
					: ruleTreeItem.childItemsAll
			})

			this.rulesTruncated = rules
		}, { name: 'Truncation' })
	}

	@computed get rulesFiltered() {
		if (this.pipeline) this.pipeline.reviewRevision // Read.
		const filter = this.filter.getState()
		const filterKeywords = (filter.Keywords?.value ?? '').toLowerCase().split(/\s+/).filter(part => part)
		const filterBaseline = filter.Baseline?.value ?? []
		const filterLevel    = filter.Level?.value    ?? []
		const filterReview   = filter.Review?.value   ?? []
		const {sortColumnIndex, sortOrder} = this

		const ruleTreeItems = [...this.rulesInUse.values()]
			.map(rule => {
				const treeItem = rule.treeItem = rule.treeItem || {
					data: rule,
					expanded: false,
				}
				return treeItem as ITreeItem<ResultOrRuleOrMore>
			})

		ruleTreeItems.forEach(treeItem => {
			const rule = treeItem.data as Rule

			// if (!treeItem.hasOwnProperty('isShowAll')) extendObservable(treeItem, { isShowAll: false })
			treeItem.isShowAll = false

			// Filtering logic: Show if 1) dropdowns match AND 2) any field matches text.
			const isDriverMatch = isMatch(this.driverName.toLowerCase(), filterKeywords)
			const ruleId = rule.id.toLowerCase()
			const ruleName = rule.name?.toLowerCase() ?? ''
			const isRuleMatch = isMatch(ruleId, filterKeywords) || isMatch(ruleName, filterKeywords)

			treeItem.childItemsAll = rule.results
				.filter(result => {
					// Possible bug with certain combinations of baseline/review show/hide.
					if (this.columns[2] && filterBaseline.length && !filterBaseline.includes(this.columns[2].filterString(result))) return false
					if (                   filterLevel   .length && !filterLevel   .includes(result.level || 'warning')           ) return false
					if (this.columns[3] && filterReview  .length && !filterReview  .includes(this.columns[3].filterString(result))) return false

					const path     = this.columns[0]?.filterString(result).toLowerCase() ?? ''
					const details  = this.columns[1]?.filterString(result).toLowerCase() ?? ''
					const baseline = this.columns[2]?.filterString(result).toLowerCase() ?? ''

					return isDriverMatch || isRuleMatch || isMatch(path, filterKeywords) || isMatch( details, filterKeywords) || isMatch(baseline, filterKeywords)
				})
				.map(result => ({ data: result })) // Can cache the result here.

			treeItem.childItemsAll.sort((treeItemLeft, treeItemRight) => {
				const resultToValue = this.columns[sortColumnIndex].sortString
				const valueLeft = resultToValue(treeItemLeft.data as Result)
				const valueRight = resultToValue(treeItemRight.data as Result)

				const inverter = sortOrder === SortOrder.ascending ? 1 : -1
				return inverter * valueLeft.localeCompare(valueRight)
			})

			return treeItem as ITreeItem<ResultOrRuleOrMore>
		})
		const ruleTreeItemsVisible =  ruleTreeItems.filter(rule => rule.childItemsAll.length)

		ruleTreeItemsVisible.sort(this.sortRuleBy === SortRuleBy.Count
			? (a, b) => b.childItemsAll.length - a.childItemsAll.length
			: (a, b) => (a.data as Rule).id.localeCompare((b.data as Rule).id)
		)
		
		ruleTreeItemsVisible.forEach((rule, i) => rule.expanded = i === 0)

		return ruleTreeItemsVisible
	}

	@computed get filteredCount() {
		return this.rulesFiltered.reduce((total, rule) => total + rule.childItemsAll.length, 0)
	}

	@observable showAllRevision = 0
	@observable.ref rulesTruncated = [] as ITreeItem<ResultOrRuleOrMore>[] // Technically ITreeItem<Rule>[], ref assuming immutable array.

	readonly columns = [
		{
			id: 'Path',
			filterString: (result: Result) => tryOr<string>(
				() => `${result.locations[0].logicalLocations[0].fullyQualifiedName} ${tryOr(() => {
						const {index} = result.locations[0].physicalLocation.artifactLocation
						return result.run.artifacts[index].description.text
					}, '')}`,
				() => result.locations[0].physicalLocation.artifactLocation.uri,
				'',
			),
			sortString:   (result: Result) => tryOr<string>(
				() => result.locations[0].physicalLocation.artifactLocation.uri,
				'\u2014', // Using escape as VS Packaging munges the char.
			),
		},
		{
			id: 'Details',
			filterString: (result: Result) => {
				const message = tryOr<string>(
					() => result.message.markdown,
					() => result.message.text, // Can be a constant?
					'')
				const snippet = tryOr<string>(
					() => result.locations[0].physicalLocation.contextRegion.snippet.text,
					() => result.locations[0].physicalLocation.region.snippet.text,
					'')
				return `${message} ${snippet}`
			},
			sortString:   (result: Result) => result.message.text as string || '',
		},
	]
}
