import './Shield.scss'
import {observable} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'

@observer export default class Shield extends React.Component<any> {
	@observable shielding = false
	componentDidMount() {
		addEventListener('dragover', e => {
			e.preventDefault()
			this.shielding = true
		})
		addEventListener('dragleave', e => {
			this.shielding = false
		})
		addEventListener('drop', async e => {
			e.preventDefault()
			this.shielding = false
			this.props.onDrop(e.dataTransfer.files[0])
		})
	}
	render() {
		return <div className={o2c({ shield: true, shieldEnabled: this.shielding })}>
			<div className="shieldInner">Drop files here</div>
		</div>
	}
}

function o2c(o) {
	// Object --> css class names (string)
	// { a: true, b: false, c: 1 } --> 'a c'
	return Object.keys(o).filter(k => o[k]).join(' ')
}
