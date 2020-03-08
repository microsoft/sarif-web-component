// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {observable} from 'mobx'
import { PipelineContext, Thread } from './PipelineContext'

export class PipelineContextDemo implements PipelineContext {
	@observable public threads = [] as Thread[]
	@observable public reviews = {}
	@observable public showReviewUpdated = false
	@observable public reviewRevision = 0

	public constructor(readonly pipelineId: string) {
		if (!pipelineId) throw new Error()
	}

	public publish() {
	}
}
