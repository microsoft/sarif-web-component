// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import {Tooltip, ITooltipProps} from 'azure-devops-ui/TooltipEx'

// Bridges two common gaps in azure-devops-ui/TooltipEx/Tooltip:
// - Tooltips with plain text. React.Children.only() rejects string.
// - Tooltips with a child that does not support onMouseEnter/Leave.
export class TooltipSpan extends React.Component<ITooltipProps> {
	render() {
		return <Tooltip {...this.props}>
			<span style={{ overflow: 'hidden' }}>{this.props.children}</span>
		</Tooltip>
	}
}
