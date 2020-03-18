// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Used solely for live development.
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Viewer } from './components/Viewer'
import sample from './resources/sample'

ReactDOM.render(
	<Viewer logs={sample}
		// hideLevel hideBaseline showAge
		// filterState={{ Suppression: { value: ['unsuppressed']} }} showSuppression
		// user={new URLSearchParams(location.search).get('user')} pipelineId={'pipeline.0'}
		/>,
	document.getElementById("app")
)
