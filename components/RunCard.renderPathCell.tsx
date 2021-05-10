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

	function getHostname(url: string | undefined): string | undefined {
		if (!url) return undefined
		try {
			return new URL(url).hostname
		} catch (_) {
			return undefined
		}
	}
	
	const href = artLoc?.properties?.['href']
	const runArtContentsText = runArt?.contents?.text
	const repositoryUri = result.run.versionControlProvenance?.[0]?.repositoryUri
	const hostname = getHostname(repositoryUri)
	const repoUriBase = artLoc?.uriBaseId // Only presence matters, not value.
		&& (hostname?.endsWith('azure.com') || hostname?.endsWith('visualstudio.com')) // We currently only support Azure DevOps.
		&& repositoryUri
		|| ''
	const repoUri = uri && repoUriBase && `${repoUriBase}?path=${encodeURIComponent(uri)}` || uri
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

		const line = region?.startLine ?? 1
		const col = region?.startColumn ?? 1
		const length = (region?.endColumn ?? 1) - col
		const [_, pre, hi, post] = new RegExp(`((?:.*?\\n){${line - 1}}.{${col - 1}})(.{${length}})((?:.|\\n)*)`, 's').exec(runArtContentsText)

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
					<TooltipSpan overflowOnly={true} text={uri} className="swcWordBreakUnset">
						{tryLink(
							getHref,
							uriWithEllipsis,
							'fontSize font-size secondary-text swcColorUnset swcWidth100' /* Override .bolt-list-cell */,
							onClick)}
					</TooltipSpan>
				</div>
			})}
		</div>,
		() => {
			return <div className="flex-row scroll-hidden">{/* From Advanced table demo. */}
				<TooltipSpan text={href ?? uri}>
					{tryLink(
						getHref,
						uriWithEllipsis,
						'swcColorUnset',
						onClick)}
				</TooltipSpan>
			</div>
		}
	)
}
