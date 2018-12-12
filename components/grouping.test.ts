// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {generateGroups, sortItems, generateItems} from './grouping.ts'

test('groups', () => {
	const results = [
		{ policy: 'Acc', path: 'd' },
		{ policy: 'Acc', path: 'c' },
		{ policy: 'Sec', path: 'b' },
		{ policy: 'Sec', path: 'a' },
	]
	const groups = generateGroups(results, ['policy'])
	expect(groups).toMatchObject([ // .children excluded as it is considered internal.
		{
			"key": "Acc",
			"name": "Acc",
			"level": 0,
			"items": [
				{"path": "d", "policy": "Acc"},
				{"path": "c", "policy": "Acc"}
			],
		},
		{
			"key": "Sec",
			"name": "Sec",
			"level": 0,
			"items": [
				{"path": "b", "policy": "Sec"},
				{"path": "a", "policy": "Sec"}
			],
		}
	])
})

test('sorts', () => {
	const results = [
		{ policy: 'Acc', rule: 'r1', path: 'd' },
		{ policy: 'Acc', rule: 'r1', path: 'c' },
		{ policy: 'Acc', rule: 'r2', path: 'b' },
		{ policy: 'Acc', rule: 'r2', path: 'a' },
		{ policy: 'Sec', rule: 'r3', path: 2    },
		{ policy: 'Sec', rule: 'r3', path: null },
		{ policy: 'Sec', rule: 'r3', path: 1    },
		{ policy: 'Sec', rule: 'r3', path: null },
	]
	const groups = generateGroups(results, ['policy', 'rule'])
	sortItems(groups, (i: { path: string }) => i.path, false)
	expect(generateItems(groups)).toMatchObject([
		{ policy: 'Acc', rule: 'r1', path: 'c' },
		{ policy: 'Acc', rule: 'r1', path: 'd' },
		{ policy: 'Acc', rule: 'r2', path: 'a' },
		{ policy: 'Acc', rule: 'r2', path: 'b' },
		{ policy: 'Sec', rule: 'r3', path: null },
		{ policy: 'Sec', rule: 'r3', path: null },
		{ policy: 'Sec', rule: 'r3', path: 1 },
		{ policy: 'Sec', rule: 'r3', path: 2 },
	])
	sortItems(groups, (i: { path: string }) => i.path, true)
	expect(generateItems(groups)).toMatchObject([
		{ policy: 'Acc', rule: 'r1', path: 'd' },
		{ policy: 'Acc', rule: 'r1', path: 'c' },
		{ policy: 'Acc', rule: 'r2', path: 'b' },
		{ policy: 'Acc', rule: 'r2', path: 'a' },
		{ policy: 'Sec', rule: 'r3', path: 2 },
		{ policy: 'Sec', rule: 'r3', path: 1 },
		{ policy: 'Sec', rule: 'r3', path: null },
		{ policy: 'Sec', rule: 'r3', path: null },
	])
})
