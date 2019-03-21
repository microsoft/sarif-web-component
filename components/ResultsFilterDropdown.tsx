// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsDropdown.scss'
import autobind from 'autobind-decorator'

import * as React from 'react'
import {observable, computed, untracked, toJS} from 'mobx'
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
	@computed get options() {
		const column = this.props.column
		const results = this.props.store.results || []
		const counts = new Map()
		results.forEach(row => {
			const cell = row[column.toLowerCase().replace(/ /g, '')]
			counts.set(cell, (counts.get(cell) || 1) + 1)
		})
		return [...counts.keys()].map(cell => ({ key: cell, text: cell, count: counts.get(cell) }))
	}
	render() {
		const {column} = this.props
		const {results, filter} = this.props.store
		return <Dropdown multiSelect className="resultsDropdown"
			label={column}
			placeholder={column}
			options={this.options}
			selectedKeys={toJS(filter[column])} // Change detects based on array identity. toJS() creates a new array.
			dropdownWidth={200}
			onChange={this.onChange}
			onRenderOption={this.onRenderOption}
			onRenderTitle={this.onRenderTitle}
			disabled={results && !results.length}
		/>
	}
	@autobind private onChange(ev, item) {
		const {store, column} = this.props
		const selectedKeys = store.filter[column]
		if (item.selected) {
			selectedKeys.push(item.key)
		} else {
			const i = selectedKeys.indexOf(item.key)
			if (i >= 0) selectedKeys.splice(i, 1)
		}
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
