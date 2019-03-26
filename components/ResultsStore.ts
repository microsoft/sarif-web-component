// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import autobind from 'autobind-decorator'
import {observable, computed, autorun, untracked, toJS, trace} from "mobx"
import {generateGroups, sortItems, generateItems} from './grouping'
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

class ResultsStore {
	@observable selKey = undefined
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
	@observable filter = {}
	@observable filterText = ''
	
	_resetFilter = autorun(() => {
		const {results} = this
		if (!results) return
		this.filter = { 'Baseline State': ['Absent', 'New', 'Updated',], 'Level': ['Error', 'Warning'] }
	})
	clearFilter() {
		this.filter = { 'Baseline State': ['Absent', 'New', 'Unchanged', 'Updated'], 'Level': ['Error', 'Warning'] }
	}
	
	@observable.shallow resultsFiltered = []
	_resultsFiltered = autorun(() => {
		const {results} = this
		if (!results) return
		
		const {filter, filterText} = this
		this.resultsFiltered = results.filter((r: any) => { // IResult
			// A matching result matches all conditions (AND), not just some (OR).
			for (const column in filter) {
				const field = r[column.toLowerCase().replace(/ /g, '')]
				const matches = filter[column].includes(field)
				if (!matches) return false
			}
			if (filterText) {
				// At least one field matching sufficient.
				const ciIncludes = (a, b) => a && a.toLowerCase().includes(b.toLowerCase())
				const rowIncludesTerm = ciIncludes(r.ruleObj && r.ruleObj.desc || '', filterText)
									 || ciIncludes(r.path                           , filterText)
									 || ciIncludes(r.details.toString()             , filterText)
				if (!rowIncludesTerm) return false
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
	
	selection = new Selection()
}

export { ResultsStore }
