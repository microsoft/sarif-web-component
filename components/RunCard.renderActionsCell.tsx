// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ZeroData } from 'azure-devops-ui/ZeroData';
import * as React from 'react'
import { Result } from 'sarif'
import './RunCard.renderCell.scss'
import { ActionProps } from './Viewer.Types';

function renderAction(props: ActionProps) {
    const { text, linkUrl, imagePath, className } = props
    return <ZeroData actionText={text}
                     actionHref={linkUrl}
                     imagePath={imagePath ?? './assets/empty.png'}
                     imageAltText={text}
                     className={className} />
}

export function renderActionsCell(result: Result) {
    return result.actions?.map(actionProps => <div className='action'>{renderAction(actionProps)}</div>);
}
