// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import { findDOMNode } from 'react-dom'
import * as highlight from 'highlight.js'
require('!style-loader!css-loader!highlight.js/styles/default.css')
import {Hi} from './Hi.tsx'

export class Colorize extends React.Component<any> {
	componentDidMount () {
		const code = findDOMNode(this.refs.code)
		code && highlight.highlightBlock(code)
	}

	componentDidUpdate () {
		highlight.initHighlighting.called = false
		const code = findDOMNode(this.refs.code)
		code && highlight.highlightBlock(code)
	}

	render () {
		const {term} = this.props
		
		const {phyLoc} = this.props
		if (!phyLoc) return null

		const region = phyLoc.region // FxCop1.sarif has phyLoc but no region.
		if (!region) return null

		let snippet = region && region.snippet && region.snippet.text || ''
		if (!snippet) return null
				
		const lines = snippet.split('\n')

		const uri = phyLoc.fileLocation.uri
		const ext = uri.match(/\.(\w+)$/)
		let lang = ext && ext[1] || uri.startsWith('http') && 'html' || ''

		if (snippet.trim() === '{') snippet = '' // Hack for FxCop.

		if (lines.length >= 3) {
			snippet = [...lines.slice(0, 3), `// ${lines.length - 3} lines truncated`].join('\n')
		} else {
			const contextRegion = phyLoc.contextRegion
			if (contextRegion) {
				const a = region.charOffset - contextRegion.charOffset
				const b = (a + region.charLength) - contextRegion.charLength
				const crst = contextRegion.snippet.text

				if (term) {
					snippet = crst
				} else {
				const marker = '\u200B'
				let markered = [crst.slice(0, a), crst.slice(a, b), crst.slice(b)].join(marker).replace(/\r/g, '')

				let lines = markered.split('\n')
				const spc = Math.min(...lines
					.filter(line => (line as any).trimStart().length) // TS2339: Property 'trimStart' does not exist on type 'string'.
					.map(line => line.length - (line as any).trimStart().length) // ^
				)
				lines = lines.map((l, i) => l.slice(spc))
				markered = lines.join('\n')

				const [pre, hi, post] = markered.split(marker)
				snippet = <>
					{pre}<span style={{ backgroundColor: 'yellow' }}>{hi}</span>{post}
				</>
				}
			}
		}
		
		if (term && typeof snippet === 'string') {
			snippet = <Hi term={term}>{snippet}</Hi>
		}

		return <pre key={Date.now()}>
			<code className={lang} ref="code">{snippet}</code>
		</pre>
	}
}
