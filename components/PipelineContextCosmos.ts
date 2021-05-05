// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { CosmosClient, Container } from '@azure/cosmos'
import { observable} from 'mobx'
import { deepObserve } from 'mobx-utils'
import { PipelineContext } from './PipelineContext'
import { DiscussionItem } from './Viewer.Discussion'

export class PipelineContextCosmos implements PipelineContext {
	private container: Container
	@observable public discussions = [] as DiscussionItem[]

	public constructor(readonly pipelineId: string) {
		if (!pipelineId) throw new Error()

		// https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-cosmos/3.9.3/index.html
		const client = new CosmosClient({
			endpoint: '',
			key: ''
		})

		;(async () => {
			const container = this.container = await client
				.database('demo')
				.container('demoContainer')

			try {
				await container.items.create({
					id: pipelineId,
					key: 'foo',
					discussions: [],
				})
			} catch (error) {
				if (error.code !== 409) console.error(error)
			}

			// When using `await container.item(pipelineId).read()`
			// the item does not return with any properties on it for some reason.
			const {resources} = await container
				.items
				.query(`SELECT * FROM c WHERE c.id = "${pipelineId}"`)
				.fetchAll()

			const storedDef = resources[0]
			this.discussions = storedDef?.discussions ?? []
			deepObserve(this.discussions, () => this.publish())
		})()
	}

	public publish() {
		this.container
			.item(this.pipelineId, 'foo')
			.replace({
				id: this.pipelineId,
				key: 'foo',
				discussions: this.discussions,
			})
	}
}
