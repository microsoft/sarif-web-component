// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import autobind from 'autobind-decorator'
import {observable, computed, autorun, untracked, toJS} from "mobx"
import {generateGroups, sortItems, generateItems} from './grouping.ts'
import {Selection} from 'office-ui-fabric-react/lib/Selection'

function debounce(ms) {
	let timeout = null
	return f => {
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			timeout = null
			f()
		}, ms)
	}
}

// Routing Tests:
// - List
//   change selection does not update URL (thus refresh stays in same mode)
//   clicking [Path >] updates URL and switches page
// - Page
//   change selection *does* update URL (use arrows keys also)
//   refresh maintains URL and selection (check url /0 also)
//   [< Build] button clears URL and takes you back
// - Browser Back takes you between selections and page
// - Switch sample clears selection (and take you back to list)
// - Filter maintains selection as long as possible
function bindHistory(store) {
	function urlToSelKey() {
		const path = document.location.pathname.slice(1)
		const selKey = !!path.length && +path
		store.selKey = Number.isInteger(selKey) ? selKey : undefined
		store.isFull = store.selKey != undefined // selKey may be 0.
	}
	addEventListener('popstate', urlToSelKey)
	urlToSelKey()
	
	// Must run after the first urlToSelKey()
	store._selKeyToUrl = autorun(() => {
		const {selKey} = this
		history.pushState(undefined, undefined, `/${selKey !== undefined ? selKey : ''}`)
	})
}

class ResultsStore {
	@observable selKey = undefined
	@observable isFull = false
	@observable isFilterHidden = false
	@observable prefix = null
	
	// sampleText
	//   |
	// results	filter	filterText
	//   |		 /      /
	// resultsFiltered
	//   |
	//   |	 groupBy
	//   |	 /     \
	// groups     columns
	//   |
	//   |  sortBy
	//   |   /
	// resultsSorted
	
	needSyncSel = false
	@observable.ref results = undefined // undef = indeterminte, [] = zero results, [...] = some results
	@observable.shallow filter = {}
	@observable filterText = ''
	
	_resetFilter = autorun(() => {
		const {results} = this
		if (!results) return
		this.filter = {} // results.some(r => r.issuetype === 'Error') ? { 'Issue Type': ['Error'] } : {}
	})
	
	@observable.shallow resultsFiltered = []
	_resultsFiltered = autorun(() => {
		const {results} = this
		if (!results) return
		
		const {filter, filterText} = this
		this.resultsFiltered = results.filter((r: any) => { // IResult
			// A matching result matches all conditions (AND), not just some (OR).
			for (const column in filter) {
				const field = r[column.toLowerCase().replace(/ /g, '')]
				const filterValues = filter[column]
				const matches = !filterValues || !filterValues.length || filterValues.includes(field)
				if (!matches) return false
			}
			if (filterText) {
				// At least one field matching sufficient.
				const ciIncludes = (a, b) => !a || a.toLowerCase().includes(b.toLowerCase())					
				if (!( ciIncludes(r.ruleObj && r.ruleObj.desc || '', filterText)
					|| ciIncludes(r.path    , filterText)
					|| ciIncludes(r.details.toString(), filterText)
				)) return false
			}
			return true
		})
	}, { scheduler: debounce(250) })
	
	@observable groupBy = 'ruleObj'
	@computed get groups(): any[] {
		return generateGroups(this.resultsFiltered, ['source', this.groupBy])
	}

	@observable.shallow sortBy: [string, boolean] = ['details', false]
	@computed get resultsSorted(): any[] {
		const groups = toJS(this.groups)
		const [sortByCol, isDesc] = this.sortBy
		sortItems(groups, ...(sortByCol && [(item: string) => item[sortByCol], isDesc] || []) as any) // Needed to generate group.counts (tally per severity).
		return generateItems(groups)
    }
	
	// After every sample change, after resultsSorted is ready, remember to rehydrate setKeySelected().
	// Don't rehydrate on other resultsSorted updates such as when filtering.
	_syncSel = autorun(() => {
		this.resultsSorted // Just to subscribe
		if (this.selection && this.needSyncSel) { // selction is null on boot.
			untracked(() => {
				// Preemptively setItems to enable setKeySelected.
				this.selection.setItems(this.resultsSorted, false /* shouldClear */)
				this.selection.setKeySelected(this.selKey + '', true, true)
			})
			this.needSyncSel = false
		}
	})
	
	selection = new Selection({
		onSelectionChanged: () => {
			if (!this.isFull) return
			const sel = this.selection.getSelection() as any[] // Normally just IObjectWithKey[]
			this.selKey = sel[0] && sel[0].key
		}
	})
}

export { ResultsStore }
