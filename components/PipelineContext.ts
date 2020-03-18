// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {observable} from 'mobx'

export class Thread {
	@observable public comments = [] as Comment[]
	constructor(public disposition: string, public keywords?: string) {}
	get when() {
		if (!this.comments.length) return new Date(0)
		return new Date(Math.max(...this.comments.map(c => c.when.getTime())))
	}
}

export class Comment {
	constructor(readonly who: string, readonly when: Date, readonly text: string) {}
}

export interface PipelineContext {
	threads: Thread[]
	reviews // null = not ready, {}|{...} = ready
	showReviewUpdated: boolean
	reviewRevision: number
	publish()
}
