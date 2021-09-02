// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './Viewer.scss'
import * as React from 'react'
import { Component } from 'react'
import { computed, observable, autorun, IObservableValue } from 'mobx'
import { observer } from 'mobx-react'
import { computedFn } from 'mobx-utils'
import { Log, Result, Run } from 'sarif'

import './extension'

// Contexts must come before renderCell or anything the uses this.
export const FilterKeywordContext = React.createContext('')
export const SnippetActionContext = React.createContext<(result: Result) => void>(undefined)

import { FilterBar, MobxFilter, recommendedDefaultState } from './FilterBar'
import { RunCard } from './RunCard'
import { RunStore } from './RunStore'
const successPng = require('./Viewer.Success.png')
const noResultsPng = require('./Viewer.ZeroData.png')

import { Card } from 'azure-devops-ui/Card'
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard"
import { Page } from 'azure-devops-ui/Page'
import { SurfaceBackground, SurfaceContext } from 'azure-devops-ui/Surface'
import { IFilterState } from 'azure-devops-ui/Utilities/Filter'
import { ZeroData } from 'azure-devops-ui/ZeroData'
import { ObservableValue } from 'azure-devops-ui/Core/Observable'

interface ViewerProps {
	logs?: Log[]

	/**
	 * Consider this the "initial" or "starting" state. This value is only applied once (during load).
	 */
	filterState?: IFilterState

	/**
	 * The state applied when the user resets. If omitted, the default is:
	 * ```javascript
	 * {
	 *     Baseline: { value: ['new', 'unchanged', 'updated'] },
	 *     Suppression: { value: ['unsuppressed'] },
	 * }
	 * ```
	 */
	defaultFilterState?: IFilterState

	user?: string
	hideBaseline?: boolean
	hideLevel?: boolean
	showSuppression?: boolean // If true, also defaults to Unsuppressed.
	showAge?: boolean // Enables age-related columns, group by age, and an age dropdown filter.

	/**
	 * When there are zero errors¹, show this message instead of just "No Results".
	 * Intended to communicate definitive positive confidence since "No Results" may be interpreted as inconclusive.
	 * 
	 * Note¹: If the (starting) `filterState` shows...
	 * * Only errors (and hides warnings),
	 *   then success is only communicated when there are zero errors (even if there exists warnings).
	 * * Both errors and warnings,
	 *   then success is communicated only when there are zero errors *and* zero warnings.
	 * * Neither errors nor warnings,
	 *   then the behavior is undefined. The current implementation will never communicate success.
	 */
	successMessage?: string

	/**
	 * The is a custom button on the top-right of every snippet. Clicking that will call this.
	 */
	onSnippetAction?: (result: Result) => void
}

@observer export class Viewer extends Component<ViewerProps> {
	private collapseComments = new ObservableValue(false)
	private filter: MobxFilter
	private groupByAge: IObservableValue<boolean>

	constructor(props) {
		super(props)
		const {defaultFilterState, filterState, showAge} = this.props
		this.filter = new MobxFilter(defaultFilterState, filterState)
		this.groupByAge = observable.box(showAge)
	}

	@observable warnOldVersion = false
	_warnOldVersion = autorun(() => {
		const {logs} = this.props
		this.warnOldVersion = logs?.some(log => log.version !== '2.1.0')
	})

	private runStores = computedFn(logs => {
		const {hideBaseline, showAge} = this.props
		if (!logs) return [] // Undef interpreted as loading.
		const runs = [].concat(...logs.filter(log => log.version === '2.1.0').map(log => log.runs)) as Run[]
		const {filter, groupByAge} = this
		const runStores = runs.map((run, i) => new RunStore(run, i, filter, groupByAge, hideBaseline, showAge))
		runStores.sort((a, b) => a.driverName.localeCompare(b.driverName)) // May not be required after introduction of runStoresSorted.
		return runStores
	}, { keepAlive: true })

	@computed get runStoresSorted() {
		const {logs} = this.props
		return this.runStores(logs).slice().sorted((a, b) => b.filteredCount - a.filteredCount) // Highest count first.
	}

	render() {
		const {hideBaseline, hideLevel, showSuppression, showAge, successMessage, onSnippetAction} = this.props

		// Computed values fail to cache if called from onRenderNearElement() for unknown reasons. Thus call them in advance.
		const currentfilterState = this.filter.getState()
		const filterKeywords = currentfilterState.Keywords?.value
		const nearElement = (() => {
			const {runStoresSorted} = this
			if (!runStoresSorted.length) return null // Interpreted as loading.
			const filteredResultsCount = runStoresSorted.reduce((total, run) => total + run.filteredCount, 0)
			if (filteredResultsCount === 0) {

				const startingFilterState = this.props.filterState || recommendedDefaultState
				const startingFilterStateLevel: string[] = startingFilterState['Level']?.value ?? []
				if (!startingFilterStateLevel.length) {
					startingFilterStateLevel.push('error', 'warning', 'note', 'none') // Normalize.
				}

				const currentfilterStateLevel: string[] = currentfilterState['Level']?.value ?? []
				if (!currentfilterStateLevel.length) {
					currentfilterStateLevel.push('error', 'warning', 'note', 'none') // Normalize.
				}

				// Desired Behavior Matrix:
				// start curr 
				// ew    ew    success (common)
				// ew    e-    noResult (there could still be warnings)
				// ew    -w    noResult (there could still be errors)
				// ew    --    noResult (there could still be either)
				// e-    ew    success
				// e-    e-    success (common)
				// e-    -w    noResult (there could still be errors)
				// e-    --    noResult (there could still be either)
				// -w    ew    success (uncommon)
				// -w    e-    noResult (there could still be warnings, uncommon)
				// -w    -w    success (uncommon)
				// -w    --    noResult (there could still be either)
				// --    **    no scenario
				const showSuccess = successMessage
					&& (!startingFilterStateLevel.includes('error')   || currentfilterStateLevel.includes('error'))
					&& (!startingFilterStateLevel.includes('warning') || currentfilterStateLevel.includes('warning'))

				if (showSuccess && !filterKeywords) {
					return <div className="page-content-left page-content-right page-content-top">
						<Card contentProps={{ contentPadding: false }}>
							<ZeroData
								imagePath={successPng}
								imageAltText="Success"
								secondaryText={successMessage} />
						</Card>
					</div>
				}

				return <div className="page-content-left page-content-right page-content-top">
					<Card contentProps={{ contentPadding: false }}>
						<ZeroData
							imagePath={noResultsPng}
							imageAltText="No results found"
							secondaryText="No results found" />
					</Card>
				</div>
			}
			return runStoresSorted
				.filter(run => !filterKeywords || run.filteredCount)
				.map((run, index) => <div key={run.logIndex} className="page-content-left page-content-right page-content-top">
					<RunCard runStore={run} index={index} runCount={runStoresSorted.length} />
				</div>)
		})() as JSX.Element

		return <FilterKeywordContext.Provider value={filterKeywords ?? ''}>
			<SnippetActionContext.Provider value={onSnippetAction}>
				<SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
					<Page>
						<div className="swcShim"></div>
						<FilterBar filter={this.filter} groupByAge={this.groupByAge.get()} hideBaseline={hideBaseline} hideLevel={hideLevel} showSuppression={showSuppression} showAge={showAge} />
						{this.warnOldVersion && <MessageCard
							severity={MessageCardSeverity.Warning}
							onDismiss={() => this.warnOldVersion = false}>
							Pre-SARIF-2.1 logs have been omitted. Use the Artifacts explorer to access all files.
						</MessageCard>}
						{nearElement}
					</Page>
				</SurfaceContext.Provider>
			</SnippetActionContext.Provider>
		</FilterKeywordContext.Provider>
	}
}
