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

import { Button } from 'azure-devops-ui/Button'
import { ClipboardButton } from "azure-devops-ui/Clipboard"
import { CustomDialog } from 'azure-devops-ui/Dialog'
import { ContentSize } from 'azure-devops-ui/Callout'

@observer export class Snippet extends React.Component<{ ploc?: PhysicalLocation, style?: React.CSSProperties, action?: () => void }> {
	static contextType = FilterKeywordContext
	@observable showAll = false
	@observable fullScreen = false

	render () {
		const {ploc, action} = this.props
		if (!ploc) return null
		if (!ploc.region) return null

		let term = this.context

		let body = tryOr(
			() => {
				const {region, contextRegion} = ploc
				if (!contextRegion) return undefined // tryOr fallthrough.

				const crst = contextRegion.snippet.text

				// Search/Filter hilighting is active so bypass snippet highlighting and return plain text.
				if (term) return crst

				let lines = crst.split('\n')
				const minLeadingWhitespace = Math.min(
					...lines
					.filter(line => line.trimLeft().length) // Blank lines often have indent 0, so throwing these out.
					.map(line => line.match(/^ */)[0].length)
				)
				lines = lines.map(line => line.slice(minLeadingWhitespace))


				// startLine is 1-based per SARIF spec
				let {startLine, startColumn = 0, endLine = startLine, endColumn = Number.MAX_SAFE_INTEGER} = region // Artibrary large value.

				// "3.30.5 startLine property - When a region object represents a text region specified by line/column properties, it SHALL contain a property..."
				// If startLine is undefined, then it not line/column-specified and likely offset/length-specified. The later is not currently supported.
				if (startLine === undefined) return undefined // tryOr fallthrough.

				startLine -= contextRegion.startLine ?? 0
				startColumn = Math.max(0, startColumn - 1 - minLeadingWhitespace) // startColumn is 1-based, string.slice() is 0-based, thus the -1 adjustment.
				endLine -= contextRegion.startLine ?? 0
				endColumn = Math.max(0, endColumn - minLeadingWhitespace)

				// Insert start stop markers.
				const marker = '\u200B'
				lines[startLine]
					= lines[startLine].slice(0, startColumn) + marker + lines[startLine].slice(startColumn)
				lines[endLine]
					= lines[endLine].slice(0, endColumn) + marker + lines[endLine].slice(endColumn)

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

		const HoverButton = (props: { iconName: string, text: string, onClick: () => void }) =>
			<div className="bolt-clipboard-button flex-self-start margin-left-4 swcHoverButton">{/* Borrowing the bolt-clipboard-button style. */}
				<Button
					ariaLabel={props.text}
					iconProps={{ iconName: props.iconName }}
					onClick={e => {
						e.stopPropagation() // Prevent showAll
						props.onClick()
					}}
					tooltipProps={{ text: props.text }}
				/>
			</div>

		// title={JSON.stringify(ploc, null, '  ')}
		return <>
			<pre className="swcSnippet swcSnippetInline"
				style={{ ...this.props.style, maxHeight: this.showAll ? undefined : 108 } as any} // 108px is a 6-line snippet which is very common.
				key={Date.now()} onClick={() => this.showAll = !this.showAll}
				ref={pre => {
					if (!pre) return
					const isClipped = pre.scrollHeight > pre.clientHeight
					if (isClipped) pre.classList.add('clipped')
					else pre.classList.remove('clipped')
				}}>
				{lineNumbersAndCode}
				<ClipboardButton
					className="flex-self-start margin-left-4 swcHoverButton"
					getContent={() => ploc.region?.snippet?.text ?? ''}
					showCopiedTooltip={'Copied snippet!'}
					tooltipProps={{ text: 'Copy snippet' }}
				/>
				<HoverButton iconName="NavigateExternalInline" text="View this Secret Hash in a new Tab" onClick={() => action?.()} />
				<HoverButton iconName="FullScreen" text="Full screen" onClick={() => this.fullScreen = true} />
			</pre>
			{this.fullScreen && <CustomDialog onDismiss={() => this.fullScreen = false} modal={true} contentSize={ContentSize.ExtraLarge}>
				<div className="scroll-auto">
					<pre className="margin-horizontal-8 margin-vertical-16 swcSnippet swcSnippetFullScreen">
						{lineNumbersAndCode}
						<ClipboardButton
							className="flex-self-start margin-left-4 swcHoverButton"
							getContent={() => ploc.contextRegion?.snippet?.text ?? ploc.region?.snippet?.text ?? ''}
							showCopiedTooltip={true}
						/>
					</pre>
				</div>
			</CustomDialog>}
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
					charOffset: 13
				},
				contextRegion: {
					snippet: { text: 'Surrounding. Content region. Surrounding.' },
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
					charOffset: 5693,
					charLength: 157,
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
					snippet: { text: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8' },
				},
			}} />
		</div>
	}
}
