// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsTab.scss'
import * as React from 'react'
import {observer} from "mobx-react"
import {IconButton} from 'office-ui-fabric-react/lib/Button'
import {Icon} from 'office-ui-fabric-react/lib/Icon'
import {ResultsDropdown} from './ResultsDropdown.tsx'

@observer export class ResultsTab extends React.Component<any> {
	render() {
		const {isFilterHidden, groupBy, resultsSorted} = this.props.store
		return <div className="resultsTab">
			<div className="resultsTitle">
				<Icon iconName="StatusErrorFull" style={{ fontSize: 48, color: '#E81123', paddingTop: 4, marginRight: 14 }} />
				<div className="resultsTitleText">
					<div>Universal store CI build 20180713.1</div>
					<div>Accessible University Tests-ASPNET-CI</div>
				</div>
			</div>
			<div className="resultsTabs">
				<span>Logs</span>
				<span>Timeline</span>
				<span>Code coverage</span>
				<span className="selected">Compliance <span className="bubble">{resultsSorted.length}</span></span>
				<span>Tests</span>
				<span>Build targets</span>
				<div style={{ flex: '1 1'}} />
				<ResultsDropdown
					placeHolder="Group by"
					options={[
						{ key: 'rule', text: 'Rule' },
						{ key: 'path', text: 'Path' },
					]}
					getSelectedKeys={()    => [groupBy]}
					setSelectedKeys={skeys => this.props.store.groupBy = skeys && skeys[0]}
				/>
				<IconButton
					ariaLabel="Show/hide column options"
					disabled={true}
					iconProps={{ iconName: 'Equalizer' }} />
				<IconButton
					ariaLabel="Show/hide Filter"
					iconProps={{ iconName: 'Filter' }}
					toggle={true} // Enable aria-pressed
					checked={!isFilterHidden}
					onClick={() => this.props.store.isFilterHidden = !isFilterHidden} />
			</div>
			{this.props.children}
		</div>
	}
}
