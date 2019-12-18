// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import 'react-dom'
jest.mock('react-dom')

import { Run } from 'sarif'
import { RunStore } from './RunStore'
import { Viewer } from './Viewer'

import { MobxFilter } from './FilterBar'
jest.mock('./FilterBar')

it('does not explode', () => { // Bare bones perf is 0.2s
	const run = {
		tool: { driver: { name: "Sample Tool" } },
		results: [{
			message: { text: 'Message 1' },
		}],
	} as Run

	const runStore = new RunStore(run, 0, new MobxFilter())
})

it('handles multiple logs', () => {
	const viewer = new Viewer({})
	
})