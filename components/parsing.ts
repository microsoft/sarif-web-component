// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const rowsToResults = (row: [any]) => {
	const result: any = {}
	'rule ruleObj source level baselinestate uri path details raw'.split(' ').forEach((col: string, i: number) => (result as any)[col] = row[i])
	return result
}

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
		const rules = (() => {
			const rules = run.tool
					&& run.tool.driver
					&& run.tool.driver.ruleDescriptors
				|| run.resources
					&& run.resources.rules
				|| run.rules
			if (!rules) return {}
			if (Array.isArray(rules)) {
				const rulesObj = {}
				rules.forEach(rule => rulesObj[rule.id] = rule)
				return rulesObj
			}
			return rules
		})()
		
		for (const ruleId in rules) {
			const rule = rules[ruleId]
			rule.toString = () => ruleId
			rule.desc = [
				ruleId,
				rule.fullDescription && rule.fullDescription.text
			].filter(i => i).join(': ')
		}
		
		let source = (run.tool.driver || run.tool).name //  + ' ' + sarif.version
		if (source === 'Microsoft.CodeAnalysis.Sarif.PatternMatcher') source = 'CredScan on Push' // Temporary.
		const results = run.results.filter(r => r.locations).map(r => {
			const ruleObj = rules[r.ruleId]
			
			const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`
			const level = r.level && capitalize(r.level) || 'Warning' // Need a non empty string for counts
			const baseline = r.baselineState && capitalize(r.baselineState) || 'New'

			const loc0 = r.locations[0]
			const message = r.message && r.message.text
				|| typeof r.message === 'string' && r.message
				|| r.message && r.message.messageId && ruleObj && ruleObj.messageStrings[r.message.messageId]
				|| r.formattedRuleMessage && r.formattedRuleMessage.formatId // Temporary compat.
				|| ''
			let phyLoc =  loc0 && loc0.physicalLocation

			const findUri = ploc => {
				if (!ploc) return
				const floc = ploc.artifactLocation || ploc.fileLocation // fileLocation is v1
				if (!floc) return
				let {uri, uriBaseId} = floc
				if (uriBaseId) {
					const baseUriObj = run.originalUriBaseIds && run.originalUriBaseIds[uriBaseId]
					if (baseUriObj) {
						const baseUri = baseUriObj.uri || baseUriObj
						uri = baseUri + uri
					}
				}
				return uri
			}

			const analysisTarget = r => // Scans of binary files are often missing physicalLocation.
				r.analysisTarget
				&& r.analysisTarget.uri
				&& r.analysisTarget.uri.split('/').pop()

			return [
				r.ruleId || 'No RuleId', // Lack of a ruleId is legal.
				ruleObj || { toString: () => r.ruleId }, // Minimal interface required to be a sortable column/key.
				source,
				level,
				baseline,
	/* uri */	 findUri(phyLoc)                         || analysisTarget(r) || '', // Should be empty?
	/* path */	(findUri(phyLoc) || '').split('/').pop() || analysisTarget(r),
				new Details(message, phyLoc, r.relatedLocations),
				r,
			]
		}).map(rowsToResults)

		return results
	}))

	results.map((result, i) => result.key = i) // Key is also used by Office Fabric Selection.

	return results
}
