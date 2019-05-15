// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
	const sarif = typeof file === 'string' ? JSON.parse(file) : file

	const results = [].concat(...sarif.runs.filter(run => run.results).map(run => {
		const rulesList = run.tool.driver.rules || []
		const rulesMap = new Map<string, any>(rulesList.map(rule => [rule.id, rule]))
		
		rulesList.forEach(rule => {
			rule.toString = () => rule.id
			rule.desc = [
				rule.id,
				rule.fullDescription && rule.fullDescription.text
			].filter(i => i).join(': ')
		})
		
		let toolDriver = run.tool.driver.name
		if (toolDriver === 'Microsoft.CodeAnalysis.Sarif.PatternMatcher') toolDriver = 'CredScan on Push' // Temporary.
		const results = run.results.filter(r => r.locations).map(r => {
			const ruleObj = rulesMap.get(r.ruleId)
			const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`

			const loc0 = r.locations[0]
			let phyLoc =  loc0 && loc0.physicalLocation

			const findUri = ploc => {
				if (!ploc || !ploc.artifactLocation) return
				let {uri, uriBaseId} = ploc.artifactLocation
				if (uriBaseId) {
					const baseUriObj = run.originalUriBaseIds && run.originalUriBaseIds[uriBaseId]
					if (baseUriObj) {
						uri = baseUriObj.uri + uri
					}
				}
				return uri
			}
			// FxCop is often missing physicalLocation and files are typically DLLs.
			const analysisTarget = r => r.analysisTarget && r.analysisTarget.uri
			const uri = findUri(phyLoc) || analysisTarget(r) || ''

			return {
				rule: r.ruleId || 'No RuleId', // Lack of a ruleId is legal.
				ruleObj: ruleObj || { toString: () => r.ruleId }, // Minimal interface required to be a sortable column/key.
				source: toolDriver,
				level: r.level && capitalize(r.level) || 'Warning', // Need a non empty string for counts
				baselinestate: r.baselineState && capitalize(r.baselineState) || 'New',
				uri,
				path: uri.split('/').pop(),
				details: new Details(r.message.text || '', phyLoc, r.relatedLocations),
				raw: r,
			}
		})

		return results
	}))

	results.map((result, i) => result.key = i) // Key is also used by Office Fabric Selection.

	return results
}
