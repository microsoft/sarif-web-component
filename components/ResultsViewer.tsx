// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import * as ReactDOM from "react-dom"
import {observer} from "mobx-react"
import {parse} from './parsing.ts'
import {ResultsStore} from './ResultsStore.ts'
import {ResultsPage} from './ResultsPage.tsx'
import {ResultsList} from './ResultsList.tsx'

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
		;(async () => this.store.results = nextProps.sarif && await parse(nextProps.sarif) || [])()
		return null
	}
	render() {
		const {isFull} = this.store
		return !isFull
			? <div className="resultsAny">
				<ResultsList store={this.store} sarif={this.props.sarif} />
			</div>
			: <ResultsPage store={this.store}>
				<ResultsList store={this.store} sarif={this.props.sarif} />
			</ResultsPage>
	}
}
