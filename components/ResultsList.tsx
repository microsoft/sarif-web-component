// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsList.scss'
import * as React from 'react'
import {untracked} from "mobx"
import {observer} from "mobx-react"
import autobind from 'autobind-decorator'

import {DetailsList, ConstrainMode, IColumn} from 'office-ui-fabric-react/lib/DetailsList'
import {IGroupDividerProps} from 'office-ui-fabric-react/lib/components/GroupedList/index'
import {SelectionMode} from 'office-ui-fabric-react/lib/utilities/selection/index'
import {ISelection} from 'office-ui-fabric-react/lib/Selection'
import {IconButton} from 'office-ui-fabric-react/lib/Button'
import {Icon} from 'office-ui-fabric-react/lib/Icon'
import {initializeIcons} from '@uifabric/icons'
initializeIcons(undefined, { disableWarnings: true }) // Warnings disabled for HMR.

import {Hi} from './Hi.tsx'
import {Colorize} from './Colorize.tsx'
import {ResultsPolicy} from './ResultsPolicy.tsx'
import {ResultsFilterDropdown} from './ResultsFilterDropdown.tsx'

import {loadTheme} from 'office-ui-fabric-react/lib/Styling'
loadTheme({
	palette: { // Consider unsetting some colors.
		neutralSecondaryAlt: 'hsl(0, 0%, 10%)',	// DetailsRow color.
		neutralSecondary:    'hsl(0, 0%, 10%)',	// DetailsRow color hover, chevron. Dropdown color, chevron.
	},
})

type IResult = any

@observer class ResultsBar extends React.Component<any> {
	render() {
		const {isFull, isFilterHidden, filterText, prefix} = this.props.store
		return !isFilterHidden && <div className="resultsBar">
			{!isFull && prefix && <span style={{ borderRight: '1px solid #efefef', flex: '0 0 auto' }}>{prefix}</span>}
			<Icon iconName="Filter" />
			<input type="text" spellCheck={false}
				value={filterText} onChange={e => this.props.store.filterText = e.target.value}
				placeholder="Filter by text" />
			{!isFull && <>
				<ResultsFilterDropdown store={this.props.store} column="Baseline State" />
				<ResultsFilterDropdown store={this.props.store} column="Issue Type" />
				<IconButton
					ariaLabel="Clear Filter"
					iconProps={{ iconName: 'Clear' }}
					onClick={this.onClearClick} />
			</>}
		</div>
	}
	@autobind private onClearClick(ev: any) {
		this.props.store.filterText = '' // Not working for the dropdowns as they own their own data.
	}
}

declare module "office-ui-fabric-react/lib/components/GroupedList/GroupedList.types" {
	interface IGroup {
		keyObj: any // object | boolean
	}
}
@observer export class ResultsList extends React.Component<any> {
	DetailsListWithCustomizations = (({ items, groups, columns, isFull, selection, setKey }) => <DetailsList
		items={items}
		groups={groups}
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
		isHeaderVisible={!isFull}
		onShouldVirtualize={() => items.length > 100}
		selectionMode={isFull ? SelectionMode.single : SelectionMode.multiple}
		selection={selection}
		styles={{ root: ['ms-DetailsList', { fontSize: '14px' }] }}
		setKey={setKey}
	/>)
	render() {
		const {sarif} = this.props
		const {isFull, results, groupBy, sortBy: [sortByCol, isDesc], resultsSorted, groups, selKey, selection} = this.props.store
		const filterText = untracked(() => this.props.store.filterText)
		
		if (results && !results.length) {
			return <div className="resultsList">
				<ResultsBar store={this.props.store} />
				<div style={{ textAlign: 'center', fontSize: 25, color: 'hsl(0, 0%, 70%)', marginTop: 150 }}>No results</div>
			</div>
		}
		
		const icons = {
			'Error':   <Icon iconName="StatusErrorFull"  style={{ color: '#E81123', marginRight: 8 }} />,
			'Warning': <Icon iconName="AlertSolid"       style={{ color: '#FF8C00', marginRight: 8 }} />,
			'Pass':    <Icon iconName="SkypeCircleCheck" style={{ color: '#107C10', marginRight: 8 }} />,
			'Unknown': <Icon iconName="InfoSolid"        style={{ color: '#FF8C00', marginRight: 8 }} />,
		}
		
		const columns: IColumn[] = [
			{
				key:  groupBy === 'ruleObj' ? 'path' : 'rule',
				name: groupBy === 'ruleObj' ? 'Path' : 'Rule',
				minWidth: 100, maxWidth: 200, className: 'resultsCell',
				onRender: (item: IResult, i: number, col: IColumn) => <>
					{icons[item.issuetype] || icons['Unknown']}
						<a href="#" onClick={ev => this.onCellClick(ev, item.key)}>
							<Hi term={filterText}>{item[col.key]}</Hi>
						</a>
					</>,
			},
			...(isFull ? [] : [
				{ minWidth: 300, key: 'details',  name: 'Details', isMultiline: true, className: 'resultsCellDetails',
					onRender: (item: IResult, i: number, col: IColumn) => {
						const details = item['details']
						const message = details.message && (filterText
							? <Hi term={filterText}>{details.message}</Hi>
							: details.message
								.split(/(?<!\w)'(.+?)'/g)
								.map((item, i) => i % 2 === 0 ? item : <code key={i}>{item}</code>) )
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
			])
		].map((col: any) => ({
			...col,
			onRender: col.onRender || ((item: IResult) => item[col.key]),
			isResizable: true,
			isSorted: col.key === sortByCol,
			isSortedDescending: isDesc,
			onColumnClick: this.onColumnClick,
		}))

		groups.forEach(group => group.children.forEach(subGroup => subGroup.level = isFull ? 1 : 0))
		
		return <div className="resultsList">
			<ResultsBar store={this.props.store} />
			{isFull
				? <this.DetailsListWithCustomizations
					items={resultsSorted}
					groups={groups}
					columns={columns}
					isFull={isFull}
					selection={selection}
					setKey={sarif} />
				: groups.map(group => <div className="resultsDomain" key={group.key}>
					<ResultsPolicy group={group as any} isTriageEnabled={!!selKey} forceUpdate={() => this.forceUpdate()} />
					{!group.isCollapsed && <this.DetailsListWithCustomizations
						items={resultsSorted}
						groups={group.children}
						columns={columns}
						isFull={isFull}
						selection={selection}
						setKey={sarif} />}
				</div>)}
		</div>
	}
	@autobind private onCellClick(ev: any, selKey: number) { // MouseEvent was not working.
		ev.stopPropagation()
		ev.preventDefault() // Prevent href=# changing the hash.
		this.props.store.selKey = selKey
		this.props.store.isFull = true
	}
	@autobind private onColumnClick(ev: Event, updatedCol: IColumn) {
		const [sortByCol, isDesc] = this.props.store.sortBy		
		this.props.store.sortBy = [updatedCol.key, sortByCol === updatedCol.key && !isDesc]
	}
	@autobind private onRenderTitle(props: IGroupDividerProps): JSX.Element {
		const {isFull} = this.props.store
		const filterText = untracked(() => this.props.store.filterText)
		const {group, group: {key, keyObj, children, count}} = props
		return (children && !isFull)
			? <ResultsPolicy group={group as any} /> // Tried casting to IResultsGroup
			: <span className="resultsGroupHeader">
				<Hi term={filterText}>{keyObj && keyObj.desc || key}</Hi>
				<span className="bubble">{count}</span>
			</span>
	}
}
