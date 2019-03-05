// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsDropdown.scss'
import autobind from 'autobind-decorator'

import * as React from 'react'
import {Dropdown, IDropdownOption} from 'office-ui-fabric-react/lib/Dropdown'

interface IResultsDropdownProps {
	placeHolder: string
	options: { key: string, text: string }[]
	getSelectedKeys: () => string[]
	setSelectedKeys: (skeys: any[]) => void // Actual type is ReactText
}
export class ResultsDropdown extends React.Component<IResultsDropdownProps> {
	render() {
		const {placeHolder, options, getSelectedKeys} = this.props
		return <Dropdown className="resultsDropdown"
			label={placeHolder}
			placeholder={placeHolder}
			options={options}
			selectedKeys      ={getSelectedKeys()}
			defaultSelectedKey={getSelectedKeys()}
			onChange={this.onChange}
			dropdownWidth={200}
			onRenderTitle={this.onRenderTitle}
		/>
	}
	@autobind private onChange(option: IDropdownOption) {
		const {setSelectedKeys} = this.props
		setSelectedKeys([option.key])
	}
	@autobind private onRenderTitle(selectedOptions: IDropdownOption[]): JSX.Element {
		const {placeHolder} = this.props
		const [first, ...rest] = selectedOptions
		return <>{placeHolder + ': ' + first.text + (rest.length ? ` (+${rest.length})` : '')}</>
	}
}
