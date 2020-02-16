// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {IObservableValue} from 'mobx'
import {Run, ReportingDescriptor, Result} from 'sarif'
import {ITreeItem} from 'azure-devops-ui/Utilities/TreeItemProvider'

declare module 'sarif' {
	interface Result {
		run: Run
		_rule: Rule // rule already used for ReportingDescriptorReference.
		firstDetection?: Date
		sla?: string
	}
}

export interface Rule extends ReportingDescriptor {
	isRule: boolean // Artifical marker to determine type.
	results: Result[]
	treeItem: ITreeItem<ResultOrRuleOrMore>
	run: Run // For taxa.
}

export interface More {
	onClick: any
}

export type ResultOrRuleOrMore = Result | Rule | More

declare module 'azure-devops-ui/Utilities/TreeItemProvider' {
	interface ITreeItem<T> {
		childItemsAll?: ITreeItem<T>[]
		isShowAll?: boolean
	}
}
