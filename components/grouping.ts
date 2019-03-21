// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

interface IGroup {
	[key: string]: any
}
interface Map<T, U> {
	[T: string]: U
}

function findOrDefault<T>(list: T[], pred: (item: T) => boolean, createItem: () => T): T {
	for (let i in list) {
		const item = list[i]
		if (pred(item)) return item
	}
	const newItem = createItem()
	list.push(newItem)
	return newItem
}

export function generateGroups(results: any[], keys: string[]): IGroup[] {
	const topLevelGroups: any[] = []
	results.forEach(row => {		
		let currentLevelGroups = topLevelGroups
		let currentLevelGroup
		for (var i = 0; i < keys.length; i++) {
			const field = row[keys[i]]
			const key = field.toString() // In case ruleId is '' and ruleObj is undef.
			currentLevelGroup = findOrDefault(
				currentLevelGroups,
				g => g.key === key,
				() => ({
					level: i,
					key,
					keyObj: typeof field === 'object' && field, // Store the original object. Used in the ruleObj case.
					name: key,
					children: [],
					// isCollapsed: !!i
				})
			)
			currentLevelGroups = currentLevelGroup.children
		}
		currentLevelGroup.items = currentLevelGroup.items || []
		currentLevelGroup.items.push(row)
	})
	return topLevelGroups
}

function sortObjects(list: any[], f: (item: any) => any, isDesc: boolean): any[] {
	list.sort((a, b) => {
		a = f(a)
		b = f(b)

		// Objects must implement toString() to be sorted.
		// Typeof null === 'object' so remember to pre-check.
		if (a && typeof a === 'object') a = a.toString()
		if (b && typeof b === 'object') b = b.toString()

		// Workaround for null and undefined bug numbers.
		if (!a && typeof b === 'number') a = 0
		if (!b && typeof a === 'number') b = 0
		if (!a && typeof b === 'string') a = ''
		if (!b && typeof a === 'string') b = ''
		
		const comparer = typeof a === 'string'
			? (a: string, b: string) => a.localeCompare(b)
			: (a: any, b: any) => a - b
		return isDesc
			? comparer(b, a)
			: comparer(a, b)
	})
	return list
}
function annotateGroupCounts(groups: IGroup[]): void {
	function recur(list: IGroup[]) {
		list.forEach((item: IGroup) => {
			let total = 0
			if (item.items) { // is Group with Results as Children
				total += item.items.length
				item.countsBug = item.items.filter((r: any) => r.bug).length
			} else {
				recur(item.children)
				item.countsBug = item.children.map((i: any) => i.countsBug).reduce((sum: number, i: number) => sum + i) // `i` is actually an extended IGroup
			}
			item.count = total

			// group.children=[] prevents "show all" from appearing.
			// Ideally this is done at generateGroups().
			if (item.children && !item.children.length) delete item.children
		})
	}
	recur(groups)
}
export function sortItems(groups: IGroup[], s2?: (item: any) => any, isDesc?: boolean): void {
	annotateGroupCounts(groups)
	const s1 = (g: IGroup) => g.count
	groups.sort((a: IGroup, b: IGroup) => a.key.localeCompare(b.key))
	groups.forEach(g1 => {
		g1.children.sort((a: IGroup, b: IGroup) => s1(b) - s1(a))
		g1.children.forEach((g2: IGroup) => {
			if (s2) sortObjects(g2.items, s2, isDesc)
		})
	})
}

export function generateItems(groups: IGroup[]): any[] { // startIndex and count done here because it's after sorting is complete, also update the count.
	const items: any[] = []
	function recur(list: IGroup[]) {
		list.forEach((item: IGroup) => {
			item.startIndex = items.length
			if (item.items) { // is Group with Results as Children
				items.push(...item.items)
			} else {
				recur(item.children)
			}
			item.count = items.length - item.startIndex
		})
	}
	recur(groups)
	return items
}
