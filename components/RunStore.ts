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
	@observable groupByAge = false
	@observable sortRuleBy = SortRuleBy.Count
	@observable sortColumnIndex = 1
	@observable sortOrder = SortOrder.ascending
	private rulesInUse: Map<string, Rule>
	private agesInUse = new Map([
		['Past SLA'  , { results: [], treeItem: null, name: 'Past SLA (31+ days)'     , isAge: true }],
		['Within SLA', { results: [], treeItem: null, name: 'Within SLA (0 - 30 days)', isAge: true }],
	])

	constructor(readonly run: Run, readonly logIndex, readonly filter: MobxFilter, readonly pipeline?: PipelineContext, readonly hideBaseline?: boolean, readonly showAge?: boolean) {
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

		if (showAge) {
			this.columns.push({
				id: 'Age',
				filterString: (result: Result) => result.sla,
				sortString:   (result: Result) => result.sla,
			})
			this.columns.push({
				id: 'First Observed', // Consider using name instead of id
				filterString: (result: Result) => result.firstDetection.toLocaleDateString(),
				sortString:   (result: Result) => result.firstDetection.getTime().toString(),
			})
		}

		const rulesListed = new Map<string, Rule>(rules.map(rule => [rule.id, rule] as any)) // Unable to express [[string, RuleEx]].
		this.rulesInUse = new Map<string, Rule>()

		run.results?.forEach(result => {
			// Collate by Rule
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

			// Collate by Age
			const firstDetection = result.provenance?.firstDetectionTimeUtc
			result.firstDetection = firstDetection ? new Date(firstDetection) : new Date()
			const age = (new Date().getTime() - result.firstDetection.getTime()) / (24 * 60 * 60 * 1000) // 1 day in milliseconds
			result.sla = age > 31 ? 'Past SLA' : 'Within SLA'
			this.agesInUse.get(result.sla).results.push(result)

			// Fill-in url from run.artifacts as needed.
			const artLoc = tryOr(() => result.locations[0].physicalLocation.artifactLocation)
			if (artLoc && artLoc.uri === undefined) {
				const art = tryOr<Artifact>(() => run.artifacts[artLoc.index])
				artLoc.uri = art.location.uri
			}

			result.run = run // For result renderer to get to run.artifacts.
			result._rule = rule
		})

		autorun(() => {
			this.showAllRevision // Read.
			const rules = this.groupByAge // Slice to satisfy ref rulesTruncated.
				? this.agesFiltered.slice()
				: this.rulesFiltered.slice()

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

	private filterHelper(treeItems: ITreeItem<ResultOrRuleOrMore>[]) {
		const filter = this.filter.getState()
		const filterKeywords = (filter.Keywords?.value ?? '').toLowerCase().split(/\s+/).filter(part => part)
		const {sortColumnIndex, sortOrder} = this

		treeItems.forEach(treeItem => {
			// if (!treeItem.hasOwnProperty('isShowAll')) extendObservable(treeItem, { isShowAll: false })
			treeItem.isShowAll = false

			// Filtering logic: Show if 1) dropdowns match AND 2) any field matches text.
			const isDriverMatch = isMatch(this.driverName.toLowerCase(), filterKeywords)

			const resultContainer = treeItem.data as { results: Result[] }
			treeItem.childItemsAll = resultContainer.results
				.filter(result => {
					const {_rule} = result
					const ruleId = _rule.id.toLowerCase()
					const ruleName = _rule.name?.toLowerCase() ?? ''
					const isRuleMatch = isMatch(ruleId, filterKeywords) || isMatch(ruleName, filterKeywords)

					for (const columnName in filter) {
						const selectedValues = filter[columnName].value
						if (!Array.isArray(selectedValues)) continue
						if (!selectedValues.length) continue
						const map = { // TODO: Dynamic lookup.
							Baseline: this.columns[2].filterString,
							Level: result => result.level || 'warning',
						}
						const translatedCellValue = map[columnName] ? map[columnName](result) : result
						if (!selectedValues.includes(translatedCellValue)) return false
					}

					const isKeywordMatch = this.columns.some(column => {
						const field = column.filterString(result).toLowerCase()
						return isMatch(field, filterKeywords)
					})

					return isDriverMatch || isRuleMatch || isKeywordMatch
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

		const treeItemsVisible = treeItems.filter(rule => rule.childItemsAll.length)

		treeItemsVisible.sort(this.sortRuleBy === SortRuleBy.Count
			? (a, b) => b.childItemsAll.length - a.childItemsAll.length
			: (a, b) => (a.data as Rule).id.localeCompare((b.data as Rule).id)
		)
		
		treeItemsVisible.forEach((rule, i) => rule.expanded = i === 0)

		return treeItemsVisible
	}

	@computed get agesFiltered() {
		if (this.pipeline) this.pipeline.reviewRevision // Read.
		const treeItems = [...this.agesInUse.values()]
			.map(age => {
				const treeItem = age.treeItem = age.treeItem || {
					data: age,
					expanded: false,
				}
				return treeItem as ITreeItem<ResultOrRuleOrMore>
			})
		return this.filterHelper(treeItems)
	}

	@computed get rulesFiltered() {
		if (this.pipeline) this.pipeline.reviewRevision // Read.
		const treeItems = [...this.rulesInUse.values()]
			.map(rule => {
				const treeItem = rule.treeItem = rule.treeItem || {
					data: rule,
					expanded: false,
				}
				return treeItem as ITreeItem<ResultOrRuleOrMore>
			})
		return this.filterHelper(treeItems)
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
