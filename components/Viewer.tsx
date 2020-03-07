// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './Viewer.scss'
import * as React from 'react'
import { Component } from 'react'
import { computed, observable, autorun, IObservableValue } from 'mobx'
import { observer } from 'mobx-react'
import { computedFn } from 'mobx-utils'
import { Log, Run } from 'sarif'

import './extension'

// Must come before renderCell or anything the uses this.
export const FilterKeywordContext = React.createContext('')

import { FilterBar, MobxFilter } from './FilterBar'
import { PipelineContext } from './PipelineContext'
import { RunCard } from './RunCard'
import { RunStore } from './RunStore'
import { Comments } from './Viewer.Comments'
const noResultsPng = require('./Viewer.ZeroData.png')

import { Card } from 'azure-devops-ui/Card'
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard"
import { Page } from 'azure-devops-ui/Page'
import { Splitter, SplitterElementPosition } from "azure-devops-ui/Splitter"
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface'
import { Toast } from "azure-devops-ui/Toast"
import { IFilterState } from 'azure-devops-ui/Utilities/Filter'
import { ZeroData } from 'azure-devops-ui/ZeroData'
import { ObservableValue } from 'azure-devops-ui/Core/Observable'

interface ViewerProps {
	logs?: Log[]
	filterState?: IFilterState
	pipelineId?: string
	user?: string
	hideBaseline?: boolean
	hideLevel?: boolean
	showAge?: boolean // Enables age-related columns, group by age, and an age dropdown filter.
}

@observer export class Viewer extends Component<ViewerProps> {
	private collapseComments = new ObservableValue(false)
	private filter: MobxFilter
	private groupByAge: IObservableValue<boolean>
	private pipelineContext?: PipelineContext

	constructor(props) {
		super(props)
		this.filter = new MobxFilter(this.props.filterState)
		this.groupByAge = observable.box(this.props.showAge)

		autorun(() => {
			this.filter.getState() // Read
			if (this.pipelineContext) this.pipelineContext.showReviewUpdated = false
		})
	}

	private pipelineContextDisposer = autorun(() => {
		const {pipelineId} = this.props
		if (!pipelineId) return
		if (![].includes(pipelineId)) return // Whitelist
		this.pipelineContext = new PipelineContext(pipelineId)
	})

	@observable warnOldVersion = false
	_warnOldVersion = autorun(() => {
		const {logs} = this.props
		this.warnOldVersion = logs?.some(log => log.version !== '2.1.0')
	})

	private runStores = computedFn(logs => {
		const {hideBaseline, showAge} = this.props
		if (!logs) return [] // Undef interpreted as loading.
		const runs = [].concat(...logs.filter(log => log.version === '2.1.0').map(log => log.runs)) as Run[]
		const {filter, groupByAge, pipelineContext} = this
		const runStores = runs.map((run, i) => new RunStore(run, i, filter, groupByAge, pipelineContext, hideBaseline, showAge))
		runStores.sort((a, b) => a.driverName.localeCompare(b.driverName)) // May not be required after introduction of runStoresSorted.
		return runStores
	}, { keepAlive: true })

	@computed get runStoresSorted() {
		const {logs} = this.props
		return this.runStores(logs).slice().sorted((a, b) => b.filteredCount - a.filteredCount) // Highest count first.
	}

	render() {
		const {pipelineContext} = this
		if (pipelineContext && !pipelineContext.reviews) return null

		const {hideBaseline, hideLevel, showAge} = this.props

		// Computed values fail to cache if called from onRenderNearElement() for unknown reasons. Thus call them in advance.
		const filterKeywords = this.filter.getState().Keywords?.value
		const nearElement = <Page>
			<div className="swcShim"></div>
			<FilterBar filter={this.filter} groupByAge={this.groupByAge.get()} hideBaseline={hideBaseline} hideLevel={hideLevel} showAge={showAge} />
			{this.warnOldVersion && <MessageCard
				severity={MessageCardSeverity.Warning}
				onDismiss={() => this.warnOldVersion = false}>
				Pre-SARIF-2.1 logs have been omitted. Use the Artifacts explorer to access all files.
			</MessageCard>}
			{(() => {
				const {runStoresSorted} = this
				if (!runStoresSorted.length) return null // Interpreted as loading.
				return !filterKeywords || runStoresSorted.reduce((total, run) => total + run.filteredCount, 0)
					? this.runStoresSorted
						.filter(run => !filterKeywords || run.filteredCount)
						.map((run, index) => <div key={run.logIndex} className="page-content-left page-content-right page-content-top">
							<RunCard runStore={run} index={index} runCount={this.runStoresSorted.length} />
						</div>)
					: <div className="page-content-left page-content-right page-content-top">
						<Card contentProps={{ contentPadding: false }}>
							<ZeroData
								imagePath={noResultsPng}
								imageAltText="No results found"
								secondaryText="No results found" />
						</Card>
					</div>
			})()}
		</Page>
		
		return <FilterKeywordContext.Provider value={filterKeywords ?? ''}>
			<SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
				<Splitter className="swcSplitter bolt-page-grey"
					collapsed={this.collapseComments} expandTooltip="Show comments"
					onCollapsedChanged={collapsed => this.collapseComments.value = collapsed}
					fixedElement={SplitterElementPosition.Far} initialFixedSize={400}
					onRenderNearElement={() => nearElement}
					onRenderFarElement={() => {
						if (!pipelineContext) return null
						return <Comments
							pipeline={pipelineContext}
							keywords={filterKeywords} user={this.props.user}
							setKeywords={keywords => {
								this.filter.setState({ ...this.filter.getState(), Keywords: { value: keywords } })
							}} />
					}}
				/>
				{pipelineContext?.showReviewUpdated && <Toast message="Some results updated."
					callToAction="Re-apply Filter" onCallToActionClick={() => {
						pipelineContext.showReviewUpdated = false
						pipelineContext.reviewRevision += 1
					}} />}
			</SurfaceContext.Provider>
		</FilterKeywordContext.Provider>
	}
}
