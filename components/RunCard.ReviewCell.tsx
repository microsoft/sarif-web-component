// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {IObservableValue} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
import {Component} from 'react'

import {Dropdown, DropdownExpandableButton} from 'azure-devops-ui/Dropdown'
import {IListBoxItem} from 'azure-devops-ui/ListBox'
import {DropdownSelection} from 'azure-devops-ui/Utilities/DropdownSelection'


import {reviewStates} from './PipelineContext'

// No longer used.
@observer export class ReviewCell extends Component<{ review: IObservableValue<string> }> {
	private selection = new DropdownSelection()

	public constructor(props) {
		super(props)
		let index = reviewStates.map(item => item.id).indexOf(this.props.review.get())
		if (index < 0) index = 0
		this.selection.select(index)
	}

	public render() {
		return <Dropdown
			items={reviewStates}
			selection={this.selection}
			renderExpandable={props => <DropdownExpandableButton {...props} />}
			onSelect={(event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
				this.props.review.set(item.id)
			}} />
	}
}
