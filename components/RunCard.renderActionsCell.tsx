// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import { Link } from 'azure-devops-ui/Link'
import { Result } from 'sarif'
import './RunCard.renderCell.scss'
import { ResultAction } from './Viewer.Types'

function isValidURL(url: string) {
	try {
		return !!new URL(url)
	} catch (error) {
		return false
	}
}

export function renderActionsCell(result: Result) {
    const actionsLinks = result.actions?.map(action => <div className='actionCell'><Link href={action.linkUrlFormat} target="_blank"><img src="../assets/vscode-icon.png" alt="VS Code" width="16" height="16" /> {action.linkText}</Link></div>);
    return <div>{actionsLinks ?? ''}</div>;
}
