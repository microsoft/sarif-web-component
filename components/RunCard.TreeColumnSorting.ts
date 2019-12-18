// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {cellFromEvent} from 'azure-devops-ui/List'
import {IBehavior} from 'azure-devops-ui/Utilities/Behavior'
import {IEventDispatch} from 'azure-devops-ui/Utilities/Dispatch'
import {ITreeProps, ITree, Tree} from 'azure-devops-ui/TreeEx'
import {KeyCode} from 'azure-devops-ui/Util'
import {sortDelegate, SortOrder} from 'azure-devops-ui/Table'

// Derived from azure-devops-ui ColumnSorting.ts
export class TreeColumnSorting<T> implements IBehavior<ITreeProps<T>, ITree<T>> {
	private onSort: sortDelegate
	private props: Readonly<ITreeProps<T>>

	constructor(onSort: sortDelegate) {
		this.onSort = onSort
	}

	public initialize = (props: Readonly<ITreeProps<T>>, table: Tree<T>, eventDispatch: IEventDispatch): void => {
		this.props = props

		eventDispatch.addEventListener("click", this.onClick)
		eventDispatch.addEventListener("keydown", this.onKeyDown)
	}

	private onClick = (event: React.MouseEvent<HTMLElement>) => {
		if (!event.defaultPrevented) {
			this.processSortEvent(event)
		}
	}

	private onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (!event.defaultPrevented) {
			if (event.which === KeyCode.enter || event.which === KeyCode.space) {
				this.processSortEvent(event)
			}
		}
	}

	private processSortEvent(event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>) {
		const clickedCell = cellFromEvent(event)

		if (clickedCell.rowIndex === -1) {
			const column = this.props.columns[clickedCell.cellIndex]

			// If the column is currently sorted ascending then we need to invert the sort.
			if (column && column.sortProps) {
				this.onSort(
					clickedCell.cellIndex,
					column.sortProps.sortOrder === SortOrder.ascending ? SortOrder.descending : SortOrder.ascending,
					event
				)
				event.preventDefault()
			}
		}
	}
}