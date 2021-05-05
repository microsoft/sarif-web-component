// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { DiscussionItem } from './Viewer.Discussion'

export class Comment {
	// Date as string for ease with Cosmos.
	constructor(readonly who: string, readonly when: string, readonly text: string) {}
}

export interface PipelineContext {
	pipelineId: string
	discussions: DiscussionItem[]
	publish()
}
