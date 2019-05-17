// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './ResultsPolicy.scss'

import * as React from 'react'
import {DefaultButton} from 'office-ui-fabric-react/lib/Button'
import {DirectionalHint} from 'office-ui-fabric-react/lib/common/DirectionalHint'
import {Icon} from 'office-ui-fabric-react/lib/Icon'
import {IconButton} from 'office-ui-fabric-react/lib/Button'

export interface IResultsGroup {
	key: string
	count: number
	countsBug: number
	isCollapsed?: boolean
}
interface IResultsPolicyProps {
	group: IResultsGroup
	isTriageEnabled?: boolean
	forceUpdate?: Function
}
export class ResultsPolicy extends React.Component<IResultsPolicyProps> {
	render() {
		const {group, isTriageEnabled, forceUpdate} = this.props
		return <div className="resultsPolicy">
			<div className="resultsPolicyTitle">
				<div>
					<div>{group.key}</div>
					<div>{group.count}</div>
					<IconButton
						className={group.isCollapsed ? 'isCollapsed' : ''}
						style={{ fontSize: 16, marginLeft: 8 }}
						iconProps={{ iconName: 'ChevronDown' }}
						onClick={() => {
							group.isCollapsed = !group.isCollapsed
							forceUpdate && forceUpdate()
						}} />
				</div>
				{/* <div>{description}</div> */}
			</div>
		</div>
	}
}
