// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import { findDOMNode } from 'react-dom'
import * as highlight from 'highlight.js'
require('!style-loader!css-loader!highlight.js/styles/default.css')
import {Hi} from './Hi.tsx'

const unindent = lines => {
	const spc = Math.min(...lines
		.filter(line => (line as any).trimLeft().length)
		.map(line => line.length - (line as any).trimLeft().length)
	)
	return lines.map(l => l.slice(spc))
}

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

		/*
		Cases:
				phyLoc
			OR			
				phyLoc.region
				  startLine, etc...
				  snippet.text
			OR
				phyLoc.region
				  startLine, etc...
				phyLoc.contextRegion
				  startLine, etc...
				  snippet.text
		*/
		
		const region = phyLoc.region 
		let snippet = region && region.snippet && region.snippet.text || ''
		if (!snippet && !phyLoc.contextRegion) return null // FxCop1.sarif has phyLoc but no region.
				
		const lines = snippet.split('\n')

		if (snippet.trim() === '{') snippet = '' // Hack for FxCop.

		if (lines.length >= 3) {
			const unindended = unindent(lines.slice(0, 3))
			snippet = [...unindended, `// ${lines.length - 3} lines truncated`].join('\n')
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
					markered = unindent(markered.split('\n')).join('\n')
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

		// This block only for lang
		const uri = phyLoc.fileLocation && phyLoc.fileLocation.uri
		const ext = uri && uri.match(/\.(\w+)$/)
		let lang = ext && ext[1] || uri && uri.startsWith('http') && 'html' || ''

		return <pre key={Date.now()}>
			<code><br />{region.startLine}<br />{region.startLine + 1}</code>
			<code className={lang} ref="code">{snippet}</code>
		</pre>
	}
}
