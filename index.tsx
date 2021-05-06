// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Used solely for live development.
import autobind from 'autobind-decorator'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Log } from 'sarif'
import { Viewer } from './components/Viewer'
import Shield from './docs-components/Shield'
import sample from './resources/sample'

// file is File/Blob
const readAsText = file => new Promise<string>((resolve, reject) => {
	let reader = new FileReader()
	reader.onload = () => resolve(reader.result as any)
	reader.onerror = reject
	reader.readAsText(file)
})

@observer export class Index extends React.Component {
	@observable discussionId = undefined
	@observable.ref logs = undefined as Log[]

	@autobind async loadFile(file) {
		if (!file) return
		if (!file.name.match(/.(json|sarif)$/i)) {
			alert('File name must end with ".json" or ".sarif"')
			return
		}
		const text = await readAsText(file)

		// Use the following lines to cache the dropped log (in localstorage) between refreshes.
		localStorage.setItem('logName', file.name)
		localStorage.setItem('log', text)

		runInAction(() => {
			this.discussionId = file.name
			this.logs = [JSON.parse(text)]
		})
		
	}

	render() {
		return <>
			<Viewer logs={this.logs}
				showSuppression // hideLevel hideBaseline showAge 
				filterState={{
					Suppression: { value: ['unsuppressed'] },
					Baseline: { value: ['new'] },
					Level: { value: ['error', 'warning'] },
				}}
				successMessage="No validated credentials detected."
			/>
			<Shield onDrop={this.loadFile} />
		</>
	}

	componentDidMount() {
		const logName = localStorage.getItem('logName')
		const log = localStorage.getItem('log')
		runInAction(() => {
			this.discussionId = logName ?? 'localhost.1'
			this.logs = log && [JSON.parse(log)] || sample
		})
	}
}

ReactDOM.render(
	<Index />,
	document.getElementById("app")
)
