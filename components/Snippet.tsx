// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './Snippet.scss'
import * as React from 'react'
import {observable} from 'mobx'
import {observer} from 'mobx-react'
import * as hljs from 'highlight.js/lib/core'
require('!style-loader!css-loader!highlight.js/styles/vs.css')
hljs.registerLanguage('csharp', require('highlight.js/lib/languages/csharp'))
hljs.registerLanguage('java', require('highlight.js/lib/languages/java'))
hljs.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'))
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'))

import {FilterKeywordContext} from './Viewer'
import {Hi} from './Hi'
import {PhysicalLocation} from 'sarif'
import {tryOr} from './try'

@observer export class Snippet extends React.Component<{ ploc?: PhysicalLocation, style?: React.CSSProperties }> {
	static contextType = FilterKeywordContext
	@observable showAll = false

	render () {
		const {ploc} = this.props
		if (!ploc) return null
		if (!ploc.region) return null

		let term = this.context

		let body = tryOr(
			() => {
				const {region, contextRegion} = ploc
				if (!contextRegion) return undefined // tryOr fallthrough.

				const crst = contextRegion.snippet.text

				// Search/Filter highlighting is active so bypass snippet highlighting and return plain text.
				if (term) return crst

				// Carriage returns (\n) causing hljs colorization off-by-one errors, thus stripping them here.
				let lines = crst.replace(/\r/g, '').split('\n')
				const minLeadingWhitespace = Math.min(
					...lines
					.filter(line => line.trimLeft().length) // Blank lines often have indent 0, so throwing these out.
					.map(line => line.match(/^ */)[0].length)
				)
				lines = lines.map(line => line.slice(minLeadingWhitespace))

				// Per 3.30.2 SARIF line and columns are 1-based.
				let {startLine, startColumn = 1, endLine = startLine, endColumn = Number.MAX_SAFE_INTEGER} = region

				// "3.30.5 startLine property - When a region object represents a text region specified by line/column properties, it SHALL contain .. startLine..."
				// If startLine is undefined, then it not line/column-specified and likely offset/length-specified. The later is not currently supported.
				if (startLine === undefined) return undefined // tryOr fallthrough.

				// Convert region to 0-based for ease of calculations.
				startLine -= 1
				startColumn -= 1
				endLine -= 1
				endColumn -= 1

				// Same comments from above apply to the contextRegion.
				let {startLine: crStartLine = 1, startColumn: crStartColumn = 1 } = contextRegion
				crStartLine -= 1
				crStartColumn -= 1

				// Map region from document coordinates to contextRegion coordinates.
				startLine -= crStartLine
				startColumn = Math.max(0, startColumn - crStartColumn - minLeadingWhitespace)
				endLine -= crStartLine
				endColumn = Math.max(0, endColumn - crStartColumn - minLeadingWhitespace)

				// Insert start stop markers.
				const marker = '\u200B'
				// Endline marker must be inserted first. Otherwise if startLine=endLine, the marker char will make the slice off by one.
				lines[endLine]
					= lines[endLine].slice(0, endColumn) + marker + lines[endLine].slice(endColumn)
				lines[startLine]
					= lines[startLine].slice(0, startColumn) + marker + lines[startLine].slice(startColumn)

				const [pre, hi, post] = lines.join('\n').split(marker)
				return <>{pre}<span className="swcRegion">{hi}</span>{post}</>
			},
			() => ploc.region.snippet.text, // No need to un-indent as these infrequently include leading whitespace.
		)
		if (!body) return null // May no longer be needed.

		if (term) body = <Hi>{body}</Hi>

		const lineNumbersAndCode = <>
			{tryOr(() => {
				const region = ploc.contextRegion || ploc.region
				if (!region.startLine) return undefined // Don't take up left margin space if there's nothing to show.
				const endLine = region.endLine ?? region.startLine
				let lineNos = ''
				for (let i = region.startLine; i <= endLine; i++) {
					lineNos += `${i}\n`
				}
				return <code className="lineNumber">{lineNos}</code>
			})}
			<code
				className={`hljs flex-grow ${ploc.artifactLocation?.uri?.match(/\.(\w+)$/)?.[1] ?? ''}`}
				style={{}}
				ref={code => {
					if (!code) return
					try {
						hljs.highlightBlock(code)
					} catch(e) {
						// Commonly throws if the language is not loaded. Will add telemetry here to track.
						console.log(code, e)
					}
				}}>
				{body}
			</code>
		</>

		// title={JSON.stringify(ploc, null, '  ')}
		return <>
			<pre className="swcSnippet"
				style={{ ...this.props.style, maxHeight: this.showAll ? undefined : 108 } as any} // 108px is a 6-line snippet which is very common.
				key={Date.now()} onClick={() => this.showAll = !this.showAll}
				ref={pre => {
					if (!pre) return
					const isClipped = pre.scrollHeight > pre.clientHeight
					if (isClipped) pre.classList.add('clipped')
					else pre.classList.remove('clipped')
				}}>
				{lineNumbersAndCode}
			</pre>
		</>
	}
}

export class SnippetTest extends React.Component {
	render() {
		return <div style={{ padding: 15 }}>
			<Snippet />
			<Snippet ploc={{}} />

			<Snippet ploc={{
				artifactLocation: {
					uri: "https://github.com/Microsoft/sarif-sdk/blob/jeff/src/Sarif/Baseline/ResultMatching/SarifLogMatcher.cs",
					index: 30
				},
				region: {
					startLine: 186,
					endLine: 196,
					snippet: {
						text: "        private ReportingDescriptor GetRuleFromResources(Result result, IDictionary<string, ReportingDescriptor> rules)\r\n        {\r\n            if (!string.IsNullOrEmpty(result.RuleId))\r\n            {\r\n                if (rules.ContainsKey(result.RuleId))\r\n                {\r\n                    return rules[result.RuleId];\r\n                }\r\n            }\r\n            return null;\r\n        }"
					}
				},
				contextRegion: {
					startLine: 183,
					endLine: 199,
					snippet: {
						text: "            return results;\n        }\n        \n        private ReportingDescriptor GetRuleFromResources(Result result, IDictionary<string, ReportingDescriptor> rules)\n        {\n            if (!string.IsNullOrEmpty(result.RuleId))\n            {\n                if (rules.ContainsKey(result.RuleId))\n                {\n                    return rules[result.RuleId];\n                }\n            }\n            return null;\n        }\n\n        private SarifLog ConstructSarifLogFromMatchedResults(\n            IEnumerable<MatchedResults> results, \n"
					}
				}
			}} />

			<Snippet ploc={{
				artifactLocation: { uri: 'folder/file.txt' },
				region: {
					snippet: { text: 'Basic.' },
				},
			}} />

			<Snippet ploc={{
				artifactLocation: { uri: 'folder/file.txt' },
				region: {
					snippet: { text: 'Content region.' },
					charOffset: 13 // charOffset currently ignored by snippet rendering.
				},
				contextRegion: {
					snippet: { text: 'Surrounding. Content region. Surrounding. Currently not rendered if no startLine.' },
				}
			}} />

			<Snippet ploc={{
				artifactLocation: {
					uri: "https://github.com/Microsoft/sarif-sdk/blob/jeff/src/Sarif.UnitTests/FileRegionsCacheTests.cs",
					index: 15,
				},
				region: {
					startLine: 107,
					endLine: 107,
				},
				contextRegion: {
					startLine: 106,
					startColumn: 1,
					endLine: 108,
					endColumn: 91,
					charOffset: 5693, // charOffset currently ignored by snippet rendering.
					charLength: 157, // charLength currently ignored by snippet rendering.
					snippet: {
						text: "\r\n        private readonly static Region s_Interior_Characters = \r\n            new Region() { Snippet = new ArtifactContent() { Text = INTERIOR_CHARACTERS },"
					},
				},
			}} />

			<Snippet ploc={{
				artifactLocation: {
					uri: "https://github.com/Microsoft/sarif-sdk/blob/jeff/src/Sarif/Visitors/SarifCurrentToVersionOneVisitor.cs",
					index: 0,
				},
				region: {
					startLine: 780,
					endLine: 780,
					snippet: {
						text: "                    (result.Fixes as List<FixVersionOne>).RemoveAll(f => f == null);"
					},
				},
				contextRegion: {
					startLine: 777,
					endLine: 783,
					snippet: {
						text: "                if (result.Fixes != null)\n                {\n                    // Null Fixes will be present in the case of unsupported encoding\n                    (result.Fixes as List<FixVersionOne>).RemoveAll(f => f == null);\n\n                    if (result.Fixes.Count == 0)\n                    {\n"
					},
				}
			}} />

			<Snippet ploc={{
				artifactLocation: { uri: 'folder/file1.txt' },
				region: {
					snippet: { text: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7 (Last line before fold) \nLine 8\nLine 9\nLine 10' },
				},
			}} />

			<Snippet ploc={{
				artifactLocation: { uri: 'folder/file1.txt' },
				contextRegion: {
					snippet: { text: '    Normalize indent: Typical\n    All lines have a least a 4 space indent\n\n    Except for empty lines (like above)\n    highlighted\n        Some lines have 8 spaces' },
				},
				region: {
					startLine: 4,
					startColumn: 5,
					snippet: {
						text: 'highlighted'
					},
				},
			}} />

			<Snippet ploc={{
				artifactLocation: { uri: 'folder/file1.txt' },
				region: {
					snippet: { text: '    Normalize indent: Currently does not apply if no context region (but maybe it should)' },
				},
			}} />

			<Snippet ploc={{
				artifactLocation: {
					uri: "https://github.com/Microsoft/sarif-sdk/blob/jeff/src/Sarif/Visitors/SarifCurrentToVersionOneVisitor.cs",
					index: 0,
				},
				contextRegion: {
					startLine: 100, // endLine defaults to startLine
					startColumn: 1, // 1-based
					snippet: {
						text: "aaabbbaaa"
					},
				},
				region: {
					startLine: 100, // endLine defaults to startLine
					startColumn: 4, // 1-based
					endColumn: 7, // 1-based
					snippet: {
						text: "bbb"
					},
				},
			}} />

			<Snippet ploc={{
				"artifactLocation": {
					"uri": "https://dev.azure.com/org/_workitems/edit/12345"
				},
				"region": {
					"startLine": 122,
					"startColumn": 875,
					"endLine": 122,
					"endColumn": 895,
					"charOffset": 9478, // charOffset currently ignored by snippet rendering.
					"charLength": 20, // charLength currently ignored by snippet rendering.
					"snippet": {
						"text": "789</span></div><div"
					}
				},
				"contextRegion": {
					"startLine": 122,
					"startColumn": 747,
					"endLine": 122,
					"endColumn": 1023,
					"charOffset": 9350, // charOffset currently ignored by snippet rendering.
					"charLength": 276, // charLength currently ignored by snippet rendering.
					"snippet": {
						"text": "le=\\\"box-sizing:border-box;\\\"><span style=\\\"box-sizing:border-box;\\\">1. Sign into Houston POS with username 123456 and password 789</span></div><div style=\\\"box-sizing:border-box;\\\"><span style=\\\"box-sizing:border-box;\\\">2. Do an exchange for item 0001</span></div><div style="
					}
				}
			}} />	
		</div>
	}
}
