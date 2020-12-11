// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {CosmosClient, Container} from '@azure/cosmos'
import {PipelineContext} from './PipelineContext'

export class PipelineContextCosmos implements PipelineContext {
	private container: Container

	public constructor(readonly pipelineId: string) {
		if (!pipelineId) throw new Error()

		const client = new CosmosClient({
			endpoint: '',
			key: ''
		})

		;(async () => {
			const container = this.container = await client
				.database('demo')
				.container('demoContainer')

			const {resources} = await container
				.items
				.query(`SELECT * FROM c WHERE c.id = "${pipelineId}"`)
				.fetchAll()

			const storedDef = resources[0]
		})()
	}

	public publish() {
		this.container
			.item(this.pipelineId, 'foo')
			.replace({
				id: this.pipelineId,
				key: 'foo',
			})
	}
}
