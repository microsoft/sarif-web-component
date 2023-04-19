// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import {FilterKeywordContext} from './Viewer'

export class Hi extends React.Component {
	static contextType = FilterKeywordContext
	render() {
		let children = this.props.children
		if (!children) return null
		if (typeof children !== 'string') return children // Gracefully (and silently) fail if not a string.

		let term = this.context
		if (!term || term.length <= 1) return children

		term = term && term.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&").replace(/\*/g, ".*")
		return children
			.split(new RegExp(`(${term.split(/\s+/).filter(part => part).join('|')})`, 'i'))
			.map((word, i) => i % 2 === 1 ? <mark key={i}>{word}</mark> : word)
	}
}
