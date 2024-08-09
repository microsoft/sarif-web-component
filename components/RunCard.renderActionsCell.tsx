// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './RunCard.renderCell.scss'

import * as React from 'react'

import { ActionProps } from './Viewer.Types';
import { Link } from 'azure-devops-ui/Link';
import { Result } from 'sarif'

const emptyPng = require('./assets/empty.png')
const vsCodePng = require('./assets/vscode-icon.png')
const vsPng = require('./assets/vs-icon.png')

const images = {
    empty: emptyPng,
    vscode: vsCodePng,
    vs: vsPng
}

function renderAction(props: ActionProps) {
    const { text, linkUrl, imageName, className } = props
    return <Link href={linkUrl} target="_blank" className={className}>
            <img src={images[imageName ?? 'empty']} alt={text} />
            {text}
        </Link>
}

export function renderActionsCell(result: Result) {
    return result.actions?.map(actionProps => <div className="action">{renderAction(actionProps)}</div>);
}
