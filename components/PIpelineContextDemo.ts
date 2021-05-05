// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { observable } from 'mobx'
import { PipelineContext } from './PipelineContext'
import { DiscussionItem } from './Viewer.Discussion'

export class PipelineContextDemo implements PipelineContext {
	@observable public discussions = [] as DiscussionItem[]

	public constructor(readonly pipelineId: string) {
		if (!pipelineId) throw new Error()
	}

	public publish() {
	}
}
