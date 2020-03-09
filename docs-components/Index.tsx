import "./index.scss"
import autobind from 'autobind-decorator'
import {observable} from "mobx"
import {observer} from "mobx-react"
import * as React from 'react'
import { Log } from 'sarif'

import { Viewer } from '../components/Viewer'
import Shield from './Shield'

const demoLog = {
	version: "2.1.0",
	runs: [{
		tool: { driver: {
			name: "Example Tool" },
		},
		results: [
			{
				ruleId: 'Example Rule',
				level: 'error',
				locations: [{
					physicalLocation: { artifactLocation: { uri: 'example.txt' } },
				}],
				message: { text: 'Welcome to the online SARIF Viewer demo. Drag and drop a SARIF file here to view.' },
			},
		],
	}]
} as Log

// file is File/Blob
const readAsText = file => new Promise<string>((resolve, reject) => {
	let reader = new FileReader()
	reader.onload = () => resolve(reader.result as any)
	reader.onerror = reject
	reader.readAsText(file)
})

@observer export class Index extends React.Component {
	@observable.ref sample = demoLog
	@autobind async loadFile(file) {
		if (!file) return
		if (!file.name.match(/.(json|sarif)$/i)) {
			alert('File name must end with ".json" or ".sarif"')
			return
		}
		this.sample = JSON.parse(await readAsText(file))
	}
	render() {
		return <>
			<div className="demoHeader">
				<span>SARIF Viewer</span>
				<span style={{ flexGrow: 1 }}></span>
				<input ref="inputFile" type="file" multiple={false} accept="*.sarif" style={{ display: 'none' }}
					onChange={async e => {
						e.persist()
						this.loadFile(Array.from(e.target.files)[0])
					}} />
				<input type="button" value="Open..." onClick={() => (this.refs.inputFile as any).click() } />&nbsp;
			</div>
			<Viewer logs={[this.sample]} hideBaseline hideLevel showSuppression showAge />
			<Shield onDrop={this.loadFile} />
		</>
	}
}
