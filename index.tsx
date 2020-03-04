// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Used solely for live development.
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Viewer } from './components/Viewer'
import sample from './resources/sample'

if (self === top) {
	ReactDOM.render(<Viewer logs={sample} />, document.getElementById("app"))
}
