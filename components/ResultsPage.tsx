// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsPage.scss'

import autobind from 'autobind-decorator'
import * as React from 'react'
import {observer} from "mobx-react"
import {Icon} from 'office-ui-fabric-react/lib/Icon'
import {Colorize} from './Colorize.tsx'

@observer export class ResultsPage extends React.Component<any> {
	render() {
		const {results, selKey} = this.props.store
		const result = results[selKey]

		return <div className="resultsPage">
			<div className="resultsPageLeft">
				<div className="resultsFullBack" onClick={this.onClick}>
					<Icon iconName="ChevronLeftSmall" /> Build
				</div>
				{this.props.children}
			</div>
			<div className="resultsPageRight resultsDetails">
				{result && <>
					<div className="resultsDetailsTitle">{result.path}</div>

					<div className="resultsDetailsSubtitle">Rule</div>
					<div className="resultsDetailsValue">{result.ruleObj.desc || result.rule}</div>

					<div className="resultsDetailsSubtitle">Message</div>
					<div className="resultsDetailsValue">{result.details.message}</div>

					<div className="resultsDetailsSubtitle">Snippet</div>
					<div className="resultsDetailsValue"><Colorize phyLoc={result['snippet']} /></div>

					{result['uri'] && <>
						<div className="resultsDetailsSubtitle">File</div>
						<div className="resultsDetailsValue"><a href={result['uri']} target="_blank" style={{ wordBreak: 'break-all' }}>{result['uri']}</a></div>
					</>}

					<div className="resultsDetailsSubtitle">Source</div>
					<div className="resultsDetailsValue">{result['source']}</div>
				</>}
			</div>
		</div>
	}
	@autobind private onClick() {
		this.props.store.selKey = undefined
		this.props.store.isFull = false
	}
}
