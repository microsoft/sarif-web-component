// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ZeroData } from 'azure-devops-ui/ZeroData';
import * as React from 'react'
import { Result } from 'sarif'
import './RunCard.renderCell.scss'
import { ActionProps } from './Viewer.Types';

const emptyPng = require('./assets/empty.png')
const vsCodePng = require('./assets/vscode-icon.png')

const images = {
    empty: emptyPng,
    vscode: vsCodePng,
}

function renderAction(props: ActionProps) {
    const { text, linkUrl, imageName, className } = props
    return <ZeroData actionText={text}
                     actionHref={linkUrl}
                     imagePath={images[imageName ?? 'empty']}
                     imageAltText={text}
                     className={className} />
}

export function renderActionsCell(result: Result) {
    return result.actions?.map(actionProps => <div className='action'>{renderAction(actionProps)}</div>);
}
