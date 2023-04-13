// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {Run, ReportingDescriptor, Result} from 'sarif'
import {ITreeItem} from 'azure-devops-ui/Utilities/TreeItemProvider'

declare module 'sarif' {
	interface Result {
		run: Run
		_rule: Rule // rule already used for ReportingDescriptorReference.
		firstDetection?: Date
		sla?: string,
		actions: ActionProps[],
	}
}

export interface Rule extends ReportingDescriptor {
	isRule: boolean // Artificial marker to determine type.
	results: Result[]
	treeItem: ITreeItem<ResultOrRuleOrMore>
	run: Run // For taxa.
}

export interface More {
	onClick: any
}

export interface ActionProps {
	text: string
	linkUrl: string
	imageName?: string
	className?: string
}

export interface RepositoryDetails {
    organizationName?: string
    projectName?: string
    repositoryName?: string
    errorMessage?: string
}

export type ResultOrRuleOrMore = Result | Rule | More

declare module 'azure-devops-ui/Utilities/TreeItemProvider' {
	interface ITreeItem<T> {
		childItemsAll?: ITreeItem<T>[]
		isShowAll?: boolean
	}
}
