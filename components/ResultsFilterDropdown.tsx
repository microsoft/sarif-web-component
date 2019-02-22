// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsDropdown.scss'
import autobind from 'autobind-decorator'

import * as React from 'react'
import {untracked} from 'mobx'
import {observer} from 'mobx-react'
import {Dropdown, IDropdownOption} from 'office-ui-fabric-react/lib/Dropdown'

type IResult = any
interface Map<T, U> {
	[T: string]: U
}

interface IResultsFilterDropdownOption extends IDropdownOption {
	text: string
	count: number
}
@observer export class ResultsFilterDropdown extends React.Component<any> {
	// 1) Take a results list and generate it's own options.
	// 2) Keeps selected state.
	private dropDown: { state: { selectedIndices: number[] }, props: { options: IDropdownOption[] } }  = null
	options = (results: IResult[], column: string, f: Function) => {
		results = results || []
		column = column.toLowerCase().replace(/ /g, '')
		const counts: Map<string, number> = {}
		results
			.map(r => f(r[column]))
			.forEach(item => counts[item] = counts[item] && counts[item] + 1 || 1)
		return Object.keys(counts).sort().map(name => ({ key: name, text: name, count: counts[name] }))
	}
	render() {
		const {column} = this.props
		const {results} = this.props.store
		const filter = untracked(() => this.props.store.filter)
		return <Dropdown multiSelect className="resultsDropdown"
			componentRef={(dd: any) => this.dropDown = dd}
			label={column}
			placeholder={column}
			options={this.options(results, column, x => x)}
			defaultSelectedKeys={filter[column]}
			dropdownWidth={200}
			onChange={this.onChanged}
			onRenderOption={this.onRenderOption}
			onRenderTitle={this.onRenderTitle}
			isDisabled={results && !results.length}
		/>
	}
	@autobind private onChanged() {
		const {column} = this.props
		setTimeout(() => { // Wait for selectedIndices to update.
			const dd = this.dropDown
			this.props.store.filter[column] = dd.state.selectedIndices.map(i => dd.props.options[i].key)
		})
	}
	@autobind private onRenderOption(option: IResultsFilterDropdownOption) {
		 return <>
			{option.text}
			{option.count !== undefined && <span aria-label={`Count ${option.count}`} style={{ marginLeft: 4 }}>({option.count})</span>}
		</>
	}
	@autobind private onRenderTitle(selectedOptions: IResultsFilterDropdownOption[]): JSX.Element {
		const {column} = this.props
		const [first, ...rest] = selectedOptions
		return (column + ': ' + first.text + (rest.length ? ` (+${rest.length})` : '')) as any // onRenderTitle is incorrectly insisting on JSX.Element where a string works.
	}
}
