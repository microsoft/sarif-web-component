// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import { Component } from 'react'

import { ObservableArray } from 'azure-devops-ui/Core/Observable'
import { List, ListItem, ListSelection } from 'azure-devops-ui/List'

@observer export class SimpleList<T> extends Component<{ items: T[] }> {
	private items = new ObservableArray<T>([])
	private selection = new ListSelection(true)

	private itemsDisposer = autorun(() => {
		this.items.value = this.props.items
	})
	
	public render() {
		return <List<T>
			itemProvider={this.items}
			selection={this.selection}
			renderRow={(index, item, details) => {
				return <ListItem index={index} details={details}>
					<div style={{ padding: '8px 16px' }}>{item}</div>
				</ListItem>
			}}
			width="100%"
			/>
	}
}
