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

export function renderActionsCell(result: Result, actions: ResultAction[]) {
    const actionsLinks = actions.map(action => <div><Link href="https://easyrhino-gh.github.io/" target="_blank">{action.linkText}</Link></div>);
    return <div>{actionsLinks}</div>;
}
