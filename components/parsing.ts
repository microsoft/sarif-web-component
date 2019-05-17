// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {IResult, RuleEx} from './Result'
import {Log} from 'sarif'
import {tryOr} from './try'

class Details {
	readonly snippet // aka phyLoc
	constructor(readonly message, phyLoc, readonly relatedLocations) {
		this.snippet = phyLoc
	}
	toString() { // For sorting
		const snippet = this.snippet
			&& this.snippet.contextRegion
			&& this.snippet.contextRegion.snippet.text
			|| this.snippet
			&& this.snippet.region
			&& this.snippet.region.snippet
			&& this.snippet.region.snippet.text
			|| ''
		return (this.message || '') + snippet
	}
}

export async function parse(file) {
	file = await file
	if (file === '') return [] // In cases such as the default/empty file.
	const sarif: Log = typeof file === 'string' ? JSON.parse(file) : file

	const flattenedRunResults = [].concat(...sarif.runs.filter(run => run.results).map(run => {
		const driverName = run.tool.driver.fullName || run.tool.driver.name.replace(/^Microsoft.CodeAnalysis.Sarif.PatternMatcher$/, 'CredScan on Push')
		const qualityDomain = tryOr(() => `(${run.tool.driver.properties['microsoft/qualityDomain']})`)
		const source = [driverName, qualityDomain].map(i => i).join(' ')

		const rulesList = run.tool.driver.rules || []
		const rulesMap = new Map<string, RuleEx>(rulesList.map(rule => [rule.id, rule] as any)) // Unable to express [[string, RuleEx]].
		rulesList.forEach((rule: RuleEx) => {
			rule.run = run // For taxonomies
			rule.toString = () => rule.id
			rule.desc = [
				rule.id,
				rule.fullDescription && rule.fullDescription.text
			].filter(i => i).join(': ') // Cached for searchability.
		})
		
		return run.results.map(r => {
			const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`

			const loc0 = r.locations[0]
			const phyLoc = loc0 && loc0.physicalLocation
			const uri = phyLoc && phyLoc.artifactLocation && phyLoc.artifactLocation.uri
				|| r.analysisTarget && r.analysisTarget.uri // FxCop is often missing physicalLocation and files are typically DLLs.
				|| ''

			return {
				rule: r.ruleId || 'No RuleId', // Lack of a ruleId is legal.
				ruleObj: rulesMap.get(r.ruleId) || { toString: () => r.ruleId }, // Minimal interface required to be a sortable column/key.
				source,
				level: r.level && capitalize(r.level) || 'Warning', // Need a non empty string for counts
				baselinestate: r.baselineState && capitalize(r.baselineState) || 'New',
				uri,
				path: uri.split('/').pop(),
				details: new Details(r.message.text || '', phyLoc, r.relatedLocations),
				raw: r,
				run: run,
			} as IResult
		})
	}))

	flattenedRunResults.forEach((result, i) => result.key = i) // Key is also used by Office Fabric Selection.
	return flattenedRunResults
}
