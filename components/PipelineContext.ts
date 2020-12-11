// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class Comment {
	constructor(readonly who: string, readonly when: Date, readonly text: string) {}
}

export interface PipelineContext {
	publish()
}
