// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { PipelineContext } from './PipelineContext'

export class PipelineContextDemo implements PipelineContext {
	public constructor(readonly pipelineId: string) {
		if (!pipelineId) throw new Error()
	}

	public publish() {
	}
}
