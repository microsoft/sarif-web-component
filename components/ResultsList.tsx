// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsList.scss'
import * as React from 'react'
import {untracked, trace} from "mobx"
import {observer} from "mobx-react"
import autobind from 'autobind-decorator'

import {DetailsList, ConstrainMode, IColumn} from 'office-ui-fabric-react/lib/DetailsList'
import {IGroupDividerProps} from 'office-ui-fabric-react/lib/components/GroupedList/index'
import {PrimaryButton} from 'office-ui-fabric-react/lib/Button'
import {SelectionMode} from 'office-ui-fabric-react/lib/utilities/selection/index'
import {ISelection} from 'office-ui-fabric-react/lib/Selection'
import {IconButton} from 'office-ui-fabric-react/lib/Button'
import {Icon} from 'office-ui-fabric-react/lib/Icon'
import {initializeIcons} from '@uifabric/icons'
initializeIcons(undefined, { disableWarnings: true }) // Warnings disabled for HMR.

import {Hi} from './Hi'
import {Colorize} from './Colorize'
import {tryOr, tryLink} from './try'
import {IResult, RuleEx} from './Result'
import {ResultsPolicy, IResultsGroup} from './ResultsPolicy'
import {ResultsFilterDropdown} from './ResultsFilterDropdown'

import {loadTheme} from 'office-ui-fabric-react/lib/Styling'
loadTheme({
	palette: { // Consider unsetting some colors.
		neutralSecondaryAlt: 'hsl(0, 0%, 10%)',	// DetailsRow color.
		neutralSecondary:    'hsl(0, 0%, 10%)',	// DetailsRow color hover, chevron. Dropdown color, chevron.
	},
})

@observer export class ResultsBar extends React.Component<any> {
	render() {
		const {isFilterHidden, filter, filterText, prefix} = this.props.store
		return !isFilterHidden && <div className="resultsBar">
			{prefix && <span style={{ borderRight: '1px solid #efefef', flex: '0 0 auto' }}>{prefix}</span>}
			<Icon iconName="Filter" />
			<input type="text" spellCheck={false}
				value={filterText} onChange={e => this.props.store.filterText = e.target.value}
				placeholder="Filter by text" />
			{Object.keys(filter).map(column => <ResultsFilterDropdown key={column} store={this.props.store} column={column} />)}
			<IconButton
				ariaLabel="Clear Filter"
				iconProps={{ iconName: 'Clear' }}
				onClick={this.onClearClick} />
		</div>
	}
	@autobind private onClearClick(ev: any) {
		this.props.store.filterText = '' // Not working for the dropdowns as they own their own data.
		this.props.store.clearFilter()
	}
}

declare module "office-ui-fabric-react/lib/components/GroupedList/GroupedList.types" {
	interface IGroup {
		keyObj: any // object | boolean
	}
}
@observer export class ResultsList extends React.Component<any> {
	render() {
		const {groupBy, sortBy: [sortByCol, isDesc], resultsSorted, groups, selKey, selection} = this.props.store
		const results = untracked(() => this.props.store.results)
		const filterText = untracked(() => this.props.store.filterText)
		
		if (results && !results.length) {
			return <div style={{ textAlign: 'center', fontSize: 25, color: 'hsl(0, 0%, 70%)', marginTop: 150 }}>No results</div>
		}
		
		if (results && !resultsSorted.length) {
			const {store} = this.props
			return <div style={{ textAlign: 'center', fontSize: 25, color: 'hsl(0, 0%, 70%)', marginTop: 150 }}>
				No matching results
				{!store.filter['Baseline State'].includes('Unchanged') && <div style={{ fontSize: 14, marginTop: 24 }}>
					<PrimaryButton text="Clear filter" onClick={() => store.clearFilter()} />
				</div>}
			</div>
		}
				
		const icons = {
			'Error':   <Icon iconName="StatusErrorFull"  style={{ color: '#E81123', marginRight: 8 }} />,
			'Warning': <Icon iconName="AlertSolid"       style={{ color: '#FF8C00', marginRight: 8 }} />,
			'Pass':    <Icon iconName="SkypeCircleCheck" style={{ color: '#107C10', marginRight: 8 }} />,
			'Unknown': <Icon iconName="InfoSolid"        style={{ color: '#FF8C00', marginRight: 8 }} />,
		}
		
		const hashLine = phyLoc => phyLoc && phyLoc.region && phyLoc.region.startLine ? `#L${phyLoc.region.startLine}` : ''
		
		const columns: IColumn[] = [
			{
				key:  groupBy === 'ruleObj' ? 'path' : 'rule',
				name: groupBy === 'ruleObj' ? 'Path' : 'Rule',
				minWidth: 100, maxWidth: 200, className: 'resultsCell',
				onRender: (item: IResult, i: number, col: IColumn) => <>
					{icons[item.level] || icons['Unknown']}
					{tryOr(
						() => <div>
							<pre style={{ marginBottom: 2 }}><code><Hi term={filterText}>{item.raw.locations[0].logicalLocation.fullyQualifiedName}</Hi></code></pre>
							{tryOr(() => {
								const {index} = item.raw.locations[0].physicalLocation.artifactLocation
								const art = item.run.artifacts[index]
								return tryLink(() => art.location.uri , art.description.text) // Missing 8px margin left.
							})}
						</div>,
						() => item.uri.endsWith('.dll')
							? <span title={item.uri}><Hi term={filterText}>{item[col.key]}</Hi></span>
							: <a href={item.uri + hashLine(item.details.snippet)} target="_blank" title={item.uri}>
								<Hi term={filterText}>{item[col.key]}</Hi>
							</a>
					)}
				</>,
			},
			{ minWidth: 300, key: 'details',  name: 'Details', isMultiline: true, className: 'resultsCellDetails',
				onRender: (item: IResult, i: number, col: IColumn) => {
					const details = item['details']
					const message = (() => {
						const {message, relatedLocations} = details
						if (!message) return undefined
						if (filterText) return <Hi term={filterText}>{message}</Hi>
						
						const rxLink = /\[([^\]]*)\]\((\d+)\)/ // Replace [text](relatedIndex) with <a href />
						if (message.match(rxLink)) {
							try {
							return message
								.split(/(\[[^\]]*\]\(\d+\))/g)
								.map((item, i) => {
									if (i % 2 === 0) return item
									const [_, text, id] = item.match(rxLink)
									const fileOrArtifact = (phy) => phy.fileLocation || phy.artifactLocation
									const phyLoc = relatedLocations[`${+id - 1}`].physicalLocation
									return <a key={i} href={fileOrArtifact(phyLoc).uri + hashLine(phyLoc)} target="_blank">{text}</a>
								})
							} catch(e) { console.log(e) }
						}
						
						if (/Edge/.test(navigator.userAgent)) return message // Edge can't parse negative lookbehind.
						
						return message
							.split(new RegExp("(?<!\\w)'(.+?)'", 'g')) // // Edge can't parse negative lookbehind.
							.map((item, i) => i % 2 === 0 ? item : <code key={i}>{item}</code>)
					})()
					const snippet = <Colorize phyLoc={details.snippet} term={filterText} />
					if (message && snippet) {
						return <div className="resultsCellCombo">
							<div>{message}</div>
							{snippet}
						</div>
					}
					return snippet || message
				},
			},
			{ key: 'baselinestate',  name: 'Baseline', minWidth: 100, maxWidth: 200, className: 'resultsCell' }
		].map((col: any) => ({
			...col,
			onRender: col.onRender || ((item: IResult) => item[col.key]),
			isResizable: true,
			isSorted: col.key === sortByCol,
			isSortedDescending: isDesc,
			onColumnClick: this.onColumnClick,
		}))

		groups.forEach(group => group.children.forEach(subGroup => subGroup.level = 0)) // Affects the indent of the Show All link.
		
		return groups.map(group => <div className="resultsDomain" key={group.key}>
			<ResultsPolicy group={group as any} isTriageEnabled={!!selKey} forceUpdate={() => this.forceUpdate()} />
			{!group.isCollapsed && <DetailsList
				items={resultsSorted}
				groups={group.children}
				groupProps={{
					showEmptyGroups: true,
					headerProps: { onRenderTitle: this.onRenderTitle },
					getGroupItemLimit: group => group.isShowingAll ? Infinity : 3,
					isAllGroupsCollapsed: true, // Future: crawl tree and look at isCollapsed state.
				}}
				constrainMode={ConstrainMode.unconstrained}
				compact={true}
				columns={columns}
				ariaLabelForSelectAllCheckbox={"Toggle selection for all items"}
				onShouldVirtualize={() => resultsSorted.length > 100}
				selectionMode={SelectionMode.none}
				selection={selection}
				styles={{ root: ['ms-DetailsList', { fontSize: '14px' }] }}
			/>}
		</div>)
	}
	@autobind private onColumnClick(ev: Event, updatedCol: IColumn) {
		const [sortByCol, isDesc] = this.props.store.sortBy		
		this.props.store.sortBy = [updatedCol.key, sortByCol === updatedCol.key && !isDesc]
	}
	@autobind private onRenderTitle(props: IGroupDividerProps): JSX.Element {
		const filterText = untracked(() => this.props.store.filterText)
		const {group, group: {key, keyObj, children, count}} = props
		const rule = keyObj as RuleEx
		return children
			? <ResultsPolicy group={group as unknown as IResultsGroup} />
			: <span className="resultsGroupHeader">
				<span className="resultsGroupHeaderText">
					{tryLink(() => rule.helpUri, <Hi term={filterText}>{rule.id}</Hi>)}
					{tryOr(() => <>: <Hi term={filterText}>{rule.fullDescription.text}</Hi></>)}
				</span>
				<span className="resultsGroupHeaderNoClip">
					{tryOr(() => rule.relationships.map(rel => {
						const taxon = rule.run.taxonomies[rel.target.toolComponent.index].taxa[rel.target.index]
						return <React.Fragment key={rel.target.id}>, {tryLink(() => taxon.helpUri, taxon.name)}</React.Fragment>
					}))}
					<span className="resultsGroupHeaderCount">{count}</span>
				</span>
			</span>
	}
}
