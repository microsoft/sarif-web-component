// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import * as ReactDOM from "react-dom"
import {observer} from "mobx-react"
import {parse} from './parsing'
import {ResultsStore} from './ResultsStore'
import {ResultsPage} from './ResultsPage.tsx'
import {ResultsBar, ResultsList} from './ResultsList.tsx'

@observer export class ResultsViewer extends React.Component<any, any> {
	state = {} // Suppress: Did not properly initialize state during construction. Expected state to be an object, but it was undefined.
	store = new ResultsStore()
	constructor(props) {
		super(props)
		this.UNSAFE_componentWillReceiveProps(props)
	}
	UNSAFE_componentWillReceiveProps(nextProps) {
		this.store.needSyncSel = true
		this.store.prefix = nextProps.prefix
		if (this.props.sarif !== nextProps.sarif) {
			;(async () => this.store.results = await parse(nextProps.sarif))()
		}
		return null
	}
	render() {
		const {isFull} = this.store
		return !isFull
			? <div className="resultsAny" data-is-scrollable>
				<div className="resultsList">
					<ResultsBar store={this.store} />
					<ResultsList store={this.store} />
				</div>
			</div>
			: <ResultsPage store={this.store}>
				<div className="resultsList">
					<ResultsBar store={this.store} />
					<ResultsList store={this.store} />
				</div>
			</ResultsPage>
	}
}
