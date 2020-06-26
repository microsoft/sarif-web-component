// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './RunCard.renderCell.scss'
import * as React from 'react'
import {Fragment} from 'react'
import * as ReactMarkdown from 'react-markdown'
import {Result} from 'sarif'

import {Hi} from './Hi'
import {tryOr, tryLink} from './try'
import {Rule, More, ResultOrRuleOrMore} from './Viewer.Types'
import {Snippet} from './Snippet'
import {TooltipSpan} from './TooltipSpan'

import {css} from 'azure-devops-ui/Util'
import {Link} from 'azure-devops-ui/Link'
import {ObservableLike} from 'azure-devops-ui/Core/Observable'
import {Status, Statuses, StatusSize} from "azure-devops-ui/Status"
import {PillSize, Pill} from 'azure-devops-ui/Pill'
import {ISimpleTableCell, TableCell} from 'azure-devops-ui/Table'
import {ExpandableTreeCell, ITreeColumn} from 'azure-devops-ui/TreeEx'
import {ITreeItemEx, ITreeItem} from 'azure-devops-ui/Utilities/TreeItemProvider'
import {Tooltip} from 'azure-devops-ui/TooltipEx'
import {Icon, IconSize} from 'azure-devops-ui/Icon'

const colspan = 99 // No easy way to parameterize this, however extra does not hurt, so using an arbitrarily large value.

function isValidURL(url: string) {
	try {
		return !!new URL(url)
	} catch (error) {
		return false
	}
}

export function renderCell<T extends ISimpleTableCell>(
	rowIndex: number,
	columnIndex: number,
	treeColumn: ITreeColumn<T>,
	treeItem: ITreeItemEx<T>): JSX.Element {

	const data = ObservableLike.getValue(treeItem.underlyingItem.data)
	const commonProps = {
		className: treeColumn.className,
		columnIndex,
		treeItem,
		treeColumn,
	}

	// ROW AGE
	const isAge = (item => item.isAge) as (item: any) => item is { name: string, treeItem: ITreeItem<ResultOrRuleOrMore> }
	if (isAge(data)) {
		const age = data
		return columnIndex === 0
			? ExpandableTreeCell({
				children: <div className="swcRowRule">{/* Div for flow layout. */}
					{age.name}
					<Pill size={PillSize.compact}>{age.treeItem.childItemsAll.length}</Pill>
				</div>,
				colspan,
				...commonProps,
			})
			: null
	}

	// ROW RULE
	const isRule = (item => item.isRule) as (item: any) => item is Rule
	if (isRule(data)) {
		const rule = data
		return columnIndex === 0
			? ExpandableTreeCell({
				children: <div className="swcRowRule">{/* Div for flow layout. */}
					{tryLink(() => rule.helpUri, <Hi>{rule.id || rule.guid}</Hi>)}
					{tryOr(() => rule.name && <>: <Hi>{rule.name}</Hi></>)}
					{tryOr(() => rule.relationships.map((rel, i) => {
						const taxon = rule.run.taxonomies[rel.target.toolComponent.index].taxa[rel.target.index]
						return <Fragment key={rel.target.id}>{i > 0 ? ',' : ''} {tryLink(() => taxon.helpUri, taxon.name)}</Fragment>
					}))}
					<Pill size={PillSize.compact}>{rule.treeItem.childItemsAll.length}</Pill>
				</div>,
				colspan,
				...commonProps,
			})
			: null
	}

	// ROW RESULT
	const capitalize = str => `${str[0].toUpperCase()}${str.slice(1)}`
	const isResult = (item => item.message !== undefined) as (item: any) => item is Result
	if (isResult(data)) {
		const result = data
		const status = {
			none: result.kind === 'pass' ? Statuses.Success : Statuses.Queued,
			note: Statuses.Information,
			error: Statuses.Failed,
		}[result.level] || Statuses.Warning
		const rowClasses = 'bolt-table-two-line-cell-item flex-row scroll-hidden'
		return columnIndex === 0
			// ExpandableTreeCell (td div.bolt-table-cell-content.flex-row.flex-center TreeExpand children)
			// calls SimpleTableCell - adds an extra div
			// calls TableCell
			? ExpandableTreeCell({ // As close to Table#TwoLineTableCell (which calls TableCell) as possible.
				children: <>
					<Status {...status} className="bolt-table-two-line-cell-icon flex-noshrink bolt-table-status-icon" size={StatusSize.m} ariaLabel={result.level || 'warning'} />
					{(() => {
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
						
						const href = artLoc?.properties?.['href']
						const runArtContentsText = runArt?.contents?.text
						const repoUriBase = artLoc?.uriBaseId // Only presence matters, not value.
							&& result.run.versionControlProvenance?.[0]?.repositoryUri.startsWith('https://dev.azure.com') // We currently only support Azure DevOps.
							&& result.run.versionControlProvenance?.[0]?.repositoryUri
							|| ''
						const repoUri = uri && repoUriBase && `${repoUriBase}?path=${encodeURIComponent(uri)}` || uri
						const getHref = () => {
							if (uri?.endsWith('.dll')) return undefined
							if (href) return href
							if (runArtContentsText) return '#'
							if (!isValidURL(repoUri)) return undefined
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

						const text = runArt?.description?.text ?? uri

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
									if (!text) throw undefined
									return <div className={rowClasses}>
										<TooltipSpan overflowOnly={true} text={text} className="swcWordBreakUnset">
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
									<TooltipSpan text={href ?? uri} disabled={uri === fileName}>
										{tryLink(
											getHref,
											uriWithEllipsis,
											'swcColorUnset',
											onClick)}
									</TooltipSpan>
								</div>
							}
						)
					})()}
				</>,
				...commonProps,
			})
			: TableCell({ // Don't want SimpleTableCell as it has flex row.
				children: (() => {
					const rule = result._rule
					switch (treeColumn.id) {
						case 'Details':
							const messageFromRule = result._rule?.messageStrings?.[result.message.id ?? -1] ?? result.message;
							const formattedMessage = format(messageFromRule.text || result.message?.text, result.message.arguments) ?? '';
							const formattedMarkdown = format(messageFromRule.markdown || result.message?.markdown, result.message.arguments); // No '—', leave undefined if empty.
							return <>
								{formattedMarkdown
									? <div className="swcMarkDown">
										<ReactMarkdown source={formattedMarkdown}
											renderers={{ link: ({href, children}) => <a href={href} target="_blank">{children}</a> }} />
									</div> // Div to cancel out containers display flex row.
									: <Hi>{renderMessageWithEmbeddedLinks(result, formattedMessage)}</Hi> || ''}
								{tryOr(() => <Snippet ploc={result.locations[0].physicalLocation} />)}
							</>
						case 'Rule':
							return <>
								{tryLink(() => rule.helpUri, <Hi>{rule.id || rule.guid}</Hi>)}
								{tryOr(() => rule.name && <>: <Hi>{rule.name}</Hi></>)}
							</>
						case 'Baseline':
							return <Hi>{result.baselineState && capitalize(result.baselineState) || 'New'}</Hi>
						case 'Bug':
							return tryOr(() => <Link href={result.workItemUris[0]} target="_blank">
								<Icon iconName="LadybugSolid" size={IconSize.medium} style={{ color: '#E81123' }} />
							</Link>)
						case 'Age':
							return <Hi>{result.sla}</Hi>
						case 'FirstObserved':
							return <Hi>{result.firstDetection.toLocaleDateString()}</Hi>
					}
				})(),
				className: css(treeColumn.className, 'font-size'),
				columnIndex,
			})
	}

	// ROW MORE
	const isMore = (item => item.onClick !== undefined) as (item: any) => item is More
	if (isMore(data)) {
		return columnIndex === 0
			? ExpandableTreeCell({
				children: <Link onClick={data.onClick} tabIndex={-1}>Show All</Link>,
				colspan,
				...commonProps
			})
			: null
	}

	return null
}

// Replace [text](relatedIndex) with <a href />
function renderMessageWithEmbeddedLinks(result: Result, message: string) {
	const rxLink = /\[([^\]]*)\]\(([^\)]+)\)/ // Matches [text](id). Similar to below, but with an extra grouping around the id part.
	return message.match(rxLink)
		? message
			.split(/(\[[^\]]*\]\([^\)]+\))/g)
			.map((item, i) => {
				if (i % 2 === 0) return item
				const [_, text, id] = item.match(rxLink)
				const href = isNaN(id as any)
					? id
					  // RelatedLocations is typically [{ id: 1, ...}, { id: 2, ...}]
					  // Consider using [].find inside of assuming the index correlates to the id.
					: result.relatedLocations[+id - 1].physicalLocation.artifactLocation.uri
						+ tryOr(() => `#L${result.locations[0].physicalLocation.region.startLine}`, '')
				return <a key={i} href={href} target="_blank">{text}</a>
			})
		: message
}

// Borrowed from sarif-vscode-extension.
function format(template: string | undefined, args?: string[]) {
	if (!template) return undefined;
	if (!args) return template;
	return template.replace(/{(\d+)}/g, (_, group) => args[group]);
}
