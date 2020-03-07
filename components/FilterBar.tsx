// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createAtom } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'

import { DropdownFilterBarItem as AzDropdownFilterBarItem } from 'azure-devops-ui/Dropdown'
import { FilterBar as AzFilterBar } from 'azure-devops-ui/FilterBar'
import { KeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem'
import { DropdownMultiSelection } from 'azure-devops-ui/Utilities/DropdownSelection'
import { Filter, FILTER_CHANGE_EVENT, IFilterState } from 'azure-devops-ui/Utilities/Filter'

export class MobxFilter extends Filter {
	private atom = createAtom('MobxFilter')
	constructor(startingState?: IFilterState) {
		super()
		this.setState(startingState, true)
		this.subscribe(() => {
			this.atom.reportChanged()
		}, FILTER_CHANGE_EVENT)
	}
	getState() {
		this.atom.reportObserved()
		return super.getState()
	}
}

@observer export class FilterBar extends React.Component<{ filter: MobxFilter, readonly groupByAge: boolean, hideBaseline?:boolean, hideLevel?: boolean, showSuppression?: boolean, showAge?: boolean }> {
	private ms1 = new DropdownMultiSelection()
	private ms2 = new DropdownMultiSelection()
	private msSuppression = new DropdownMultiSelection()
	private msAge = new DropdownMultiSelection()
	
	render() {
		const {filter, groupByAge, hideBaseline, hideLevel, showSuppression, showAge} = this.props
		return <AzFilterBar filter={filter}>
			<KeywordFilterBarItem filterItemKey="Keywords" placeholder="Filter by keyword" />
			{!hideBaseline && <AzDropdownFilterBarItem
				filterItemKey="Baseline"
				placeholder="Baseline"
				showPlaceholderAsLabel
				items={['New', 'Unchanged', 'Updated', 'Absent'].map(text => ({ id: text.toLowerCase(), text }))}
				selection={this.ms1}
				 />}
			{!hideLevel && <AzDropdownFilterBarItem
				filterItemKey="Level"
				placeholder="Level"
				showPlaceholderAsLabel
				items={['None', 'Note', 'Warning', 'Error'].map(text => ({ id: text.toLowerCase(), text }))}
				selection={this.ms2}
				 />}
			{showSuppression && <AzDropdownFilterBarItem
				filterItemKey="Suppression"
				placeholder="Suppression"
				showPlaceholderAsLabel
				items={['Unsuppressed', 'Suppressed'].map(text => ({ id: text.toLowerCase(), text }))}
				selection={this.msSuppression}
				 />}
			{showAge && !groupByAge && <AzDropdownFilterBarItem
				filterItemKey="Age"
				placeholder="Age"
				showPlaceholderAsLabel
				items={['Past SLA', 'Within SLA'].map(text => ({ id: text.toLowerCase(), text }))}
				selection={this.msAge}
				 />}
		</AzFilterBar>
	}
}
