// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import './Viewer.Comments.scss'
import { computed, observable } from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react'
import {Component} from 'react'
// import Linkify from 'react-linkify'

import { Hi } from './Hi'
import { isMatch } from './RunStore'

import { Ago } from "azure-devops-ui/Ago"
import { Button } from 'azure-devops-ui/Button'
import { ObservableValue } from 'azure-devops-ui/Core/Observable'
import { Dropdown, DropdownExpandableButton } from 'azure-devops-ui/Dropdown'
import { FormItem } from "azure-devops-ui/FormItem"
import { IconSize } from 'azure-devops-ui/Icon'
import { Page } from 'azure-devops-ui/Page'
import { Pill } from 'azure-devops-ui/Pill'
import { TextField } from 'azure-devops-ui/TextField'
import { VssPersona } from 'azure-devops-ui/VssPersona'
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection'

export class MobxDropdown extends Component<{ className?: string, items: string[], selection: string, onSelect: (item: string) => void, width?: number }>{
	private selection = new DropdownSelection()

	constructor(props) {
		super(props)
		const {items, selection} = this.props
		this.selection.select(Math.max(0, items.indexOf(selection)))
	}

	render() {
		return <Dropdown
			className={this.props.className}
			items={this.props.items}
			selection={this.selection}
			renderExpandable={props => <DropdownExpandableButton onClick={e => e.stopPropagation()} {...props} />}
			onSelect={(e, item) => {
				e.stopPropagation()
				this.props.onSelect(item.id)
			}}
			width={this.props.width}
			/>
	}
}

export interface PipelineContext {
	threads: Thread[]
	reviews // null = not ready, {}|{...} = ready
	showReviewUpdated: boolean
	reviewRevision: number
	publish()
}

class Thread {
	@observable public comments = [] as Comment[]
	constructor(public disposition: string, public keywords?: string) {}
	get when() {
		if (!this.comments.length) return new Date(0)
		return new Date(Math.max(...this.comments.map(c => new Date(c.when).getTime())))
	}
}

class Comment {
	constructor(readonly who: string, readonly when: Date, readonly text: string) {}
}

// PipelineContext expected to be ready.
@observer export class Comments extends Component<{ pipeline: PipelineContext, keywords: string, user?: string, setKeywords: any }> {
	private newComment = new ObservableValue('')
	private newCommentError = new ObservableValue(false)
	private dispositions = [
		'Valid: Should fix, P1',
		'Valid: Should fix, P2' ,
		'Valid: Should fix, P3',
		'Valid: Ignore for 90 days',
		'Valid: Not worth fixing',
		'Invalid: False positive',
		'TBD: Discussion'
	] // Static?

	@computed get threads() {
		const keywords = this.props.keywords?.toLowerCase().split(/\s+/).filter(part => part) ?? []
		const threads = this.props.pipeline.threads.filter(thread => isMatch((thread.keywords || '').toLowerCase(), keywords))
		threads.sort((a, b) => a.when.getTime() - b.when.getTime())
		return threads
	}

	public render() {
		const {pipeline} = this.props
		const count = pipeline.threads.length
		const hiddenCount = count - this.threads.length

		return <>
			{!!hiddenCount && <div className="swcCommentsBanner">
				<span>Some comments hidden.</span>
				<Button text="Clear filter" onClick={() => { this.props.setKeywords(undefined) }} />
			</div>}
			<Page className="swcComments">
				<div className="swcCommentsHeader" style={{ margin: !!hiddenCount ? '0 0 12px 0' : '12px 0' }}>Topics <Pill>{pipeline.threads.length}</Pill></div>
				<div className="swcCommentsList">
					{(() => {
						if (!count)
							return <div className="swcCommentsZero">No comments</div>

						if (!this.threads.length)
							return <div className="swcCommentsZero">No comment threads matching "{this.props.keywords}"</div>

						const elements = [] as React.ReactNodeArray
						this.threads.forEach(topic => {
							elements.push(<div className="swcCommentKeywords" key={topic.keywords ?? ''}>
								<span><Hi>{topic.keywords || ''}</Hi></span>
								<span style={{ flex: '1' }}></span>
								{topic.keywords && <Button
									iconProps={{ iconName: 'Filter', size: IconSize.small }}
									tooltipProps={{ text: `Apply filter "${topic.keywords}"` }}
									onClick={() => { topic.keywords && this.props.setKeywords(topic.keywords) }} />}
								<MobxDropdown className="swcDispositionDropdown" items={this.dispositions} selection={topic.disposition} onSelect={item => { topic.disposition = item; pipeline.publish(); }} width={200} />
							</div>)
							elements.push(...topic.comments.map(comment => {
								// const componentDecorator = (href, text, key) => <a href={href} key={key} target="_blank">{text}</a>
								const {who, when, text} = comment
								return <div className="swcCommentRowContent flex-row flex-start" key={when.getTime()}>
									<VssPersona size="small" />
									<div className="flex-column">
										<div className="flex-row swcCommentTitle">
											<div className="primary-text text-ellipsis swcCommentPerson">{who}</div>
											<div className="secondary-text"><Ago date={when} /></div>
										</div>
										<div className="secondary-text">
											{/* Investigate: Linkify causing the following erro: */}
											{/* Uncaught TypeError: Super expression must either be null or a function, not undefined */}
											{/* <Linkify componentDecorator={componentDecorator}>{text}</Linkify> */}
											{text}
										</div>
									</div>
								</div>
							}))
						})
						return elements
					})()}
				</div>
				<FormItem error={this.newCommentError}>
					<TextField
						ariaLabel="Type a new comment"
						placeholder="Type a new comment"
						value={this.newComment}
						onChange={(e, newValue) => {
							this.newComment.value = newValue
							this.newCommentError.value = !this.newComment.value
						}}
						onKeyPress={e => {
							if (e.shiftKey && e.key === 'Enter') {
								this.send()
								e.preventDefault()
							}
						}}
						multiline rows={4}
					/>
				</FormItem>
				<Button className="swcCommentSend" iconProps={{ iconName: 'Comment' }} text="Comment" onClick={() => this.send()} />
			</Page>
		</>
	}

	componentDidMount() {
		this.scrollToBottom()
	}

	private scrollToBottom() {
		const list = document.querySelector('.swcCommentsList')
		list.scrollTop = list.scrollHeight
	}

	private send() {
		this.newCommentError.value = !this.newComment.value
		if (this.newCommentError.value) return

		const {pipeline, user} = this.props
		const keywords = this.props.keywords ?? ''

		let thread = pipeline.threads.find(thread => thread.keywords === keywords)
		if (!thread) {
			thread = new Thread(this.dispositions[0], keywords)
			pipeline.threads.push(thread)
		}

		thread.comments.push(new Comment(
			user ?? 'Anonymous',
			new Date(),
			this.newComment.value
		))
		pipeline.publish()

		this.newComment.value = ''
		requestAnimationFrame(() => this.scrollToBottom())
	}
}
