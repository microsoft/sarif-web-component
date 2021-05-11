// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Tooltip } from 'azure-devops-ui/TooltipEx'
import * as React from 'react'
import { Result } from 'sarif'
import { Hi } from './Hi'
import './RunCard.renderCell.scss'
import { TooltipSpan } from './TooltipSpan'
import { tryLink, tryOr } from './try'

function isValidURL(url: string) {
	try {
		return !!new URL(url)
	} catch (error) {
		return false
	}
}

interface SimpleRegion {
	startLine?: number
	startColumn?: number
	endColumn?: number
}

function openInNewTab(fileName: string, text: string, region: SimpleRegion | undefined): void {
	const line = region?.startLine ?? 1
	const col = region?.startColumn ?? 1
	const length = (region?.endColumn ?? 1) - col
	const [_, pre, hi, post] = new RegExp(`((?:.*?\\n){${line - 1}}.{${col - 1}})(.{${length}})((?:.|\\n)*)`, 's').exec(text)

	const escape = unsafe => unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

	const {document} = window.open()
	document.title = fileName
	document.body.innerHTML = `<pre>${escape(pre)}<mark>${escape(hi)}</mark>${escape(post)}</pre>`
	setTimeout(() => document.body.querySelector('mark').scrollIntoView({ block: 'center' }))
}

function getRepoUri(uri: string | undefined, uriBaseId: string | undefined, repositoryUri: string | undefined): string | undefined {
	if (!uri) return undefined

	function getHostname(url: string | undefined): string | undefined {
		if (!url) return undefined
		try {
			return new URL(url).hostname
		} catch (_) {
			return undefined
		}
	}
	const hostname = getHostname(repositoryUri)
	const repoUriBase = uriBaseId // Only presence matters, not value.
		&& (hostname?.endsWith('azure.com') || hostname?.endsWith('visualstudio.com')) // We currently only support Azure DevOps.
		&& repositoryUri
	if (!repoUriBase) return undefined

	return `${repoUriBase}?path=${encodeURIComponent(uri)}`
}

export function renderPathCell(result: Result) {
	const ploc = result.locations?.[0]?.physicalLocation
	const artLoc = ploc?.artifactLocation
		?? result.analysisTarget
	const runArt = result.run.artifacts?.[artLoc?.index ?? -1]
	const uri = artLoc?.description?.text
		?? runArt?.description?.text
		?? artLoc?.uri
		?? runArt?.location?.uri // Commonly a relative URI.
	const [path, fileName] = (() => {
		if (!uri) return ['—']
		const index = uri.lastIndexOf('/')
		return index >= 0
			? [uri.slice(0, index), uri.slice(index + 1)]
			: [uri]
	})()
	const uriWithEllipsis = fileName
		? <span className="midEllipsis">
			<span><Hi>{path}</Hi></span>
			<span><Hi>/{fileName}</Hi></span>
		</span>
		: <Hi>{uri ?? '—'}</Hi>
	
	// Example of href scenario:
	// uri  = src\Prototypes\README.md
	// href = https://org.visualstudio.com/project/_git/repo?path=%2Fsrc%2FPrototypes%2FREADME.md&_a=preview
	const href = artLoc?.properties?.['href']

	const runArtContentsText = runArt?.contents?.text
	const repoUri = getRepoUri(uri, artLoc?.uriBaseId, result.run.versionControlProvenance?.[0]?.repositoryUri) ?? uri

	const getHref = () => {
		if (uri?.endsWith('.dll')) return undefined
		if (href) return href
		if (runArtContentsText) return '#'
		if (!isValidURL(repoUri)) return undefined // uri as artDesc case takes this code path.
		return repoUri
	}

	const region = ploc?.region
	const onClick = event => {
		if (href) return // TODO: Test precedence.
		if (!runArtContentsText) return
		event.preventDefault()
		event.stopPropagation()
		openInNewTab(fileName, runArtContentsText, region)
	}

	const rowClasses = 'bolt-table-two-line-cell-item flex-row scroll-hidden'

	return tryOr(
		() => <div className="flex-column scroll-hidden">
			<div className={rowClasses}>
				<div className="fontsize font-size swcWidth100">{/* Constraining width to 100% to play well with the Tooltip. */}
					<Tooltip overflowOnly={true}>
						<pre style={{ margin: 0 }}><code><Hi>{result.locations[0].logicalLocations[0].fullyQualifiedName}</Hi></code></pre>
					</Tooltip>
				</div>
			</div>
			{tryOr(() => {
				if (!uri) throw undefined
				return <div className={rowClasses}>
					{/* TODO: Enable tooltip if a) inner !== href, or b) inner === href and inner is clipped (aka overflowing) */}
					<TooltipSpan overflowOnly={true} text={href ?? uri}>
						{tryLink(
							getHref,
							uriWithEllipsis,
							'fontSize font-size secondary-text swcColorUnset swcWidth100' /* Override .bolt-list-cell */,
							onClick)}
					</TooltipSpan>
				</div>
			})}
		</div>,
		() => <div className="flex-row scroll-hidden">{/* From Advanced table demo. */}
			<TooltipSpan overflowOnly={true} text={href ?? uri}>
				{tryLink(
					getHref,
					uriWithEllipsis,
					'swcColorUnset',
					onClick)}
			</TooltipSpan>
		</div>
	)
}
