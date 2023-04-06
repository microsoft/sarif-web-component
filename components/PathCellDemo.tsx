// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import { Result, Run } from 'sarif'
import './RunCard.renderCell.scss'
import { renderPathCell } from './RunCard.renderPathCell'

export function* demoResults() {
	const clone = <T,>(o: T) => JSON.parse(JSON.stringify(o)) as T

	const emptyResult: Result = {
		message: {},
		run: {} as any,
		_rule: {} as any,
		actions: {} as any
	}

	{ // fullyQualifiedName
		const result = clone(emptyResult)

		// no fullyQualifiedName
		yield clone(result)
		
		// fullyQualifiedName
		result.locations = [{
			logicalLocations: [{
				fullyQualifiedName: 'fullyQualifiedName'
			}]
		}]
		yield clone(result)

		// fullyQualifiedName + uri
		result.locations[0].physicalLocation = {
			artifactLocation: {
				uri: 'https://example.com/folder/file1.txt'
			}
		}
		yield clone(result)

		// fullyQualifiedName + uri overshadowed by artifactDescription
		result.run = {
			artifacts: [{
				description: {
					text: 'Artifact Description'
				}
			}]
		} as Run
		result.locations[0].physicalLocation.artifactLocation.index = 0
		yield clone(result)
	}

	
	{ // long uri
		// = ellipsis and link
		const result: Result = clone(emptyResult)
		result.locations = [{
			physicalLocation: {
				artifactLocation: {
					uri: 'https://example.com/folder1/folder2/folder3/file1.txt'
				}
			}
		}]
		yield clone(result)

		// long uri, but not url
		// = ellipsis and no link
		result.locations = [{
			physicalLocation: {
				artifactLocation: {
					uri: '/folder1/folder2/folder3/folder4/folder5/file1.txt'
				}
			}
		}]
		yield clone(result)
	}

	// Artifact contents
	const resultWithContents: Result = clone(emptyResult)
	resultWithContents.run = {
		artifacts: [{
			location: {
				uri: 'contents.txt'
			},
			contents: {
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
			}
		}]
	} as Run
	resultWithContents.locations = [{
		physicalLocation: {
			artifactLocation: {
				index: 0
			}
		}
	}]
	yield clone(resultWithContents)

	// repositoryUri only
	// = no href
	const resultWithRepo: Result = clone(emptyResult)
	resultWithRepo.run = {
		versionControlProvenance: [{
			repositoryUri: 'https://dev.azure.com/Office/Office/_git/Office',
		}]
	} as Run
	resultWithRepo.locations = [{
		physicalLocation: {
			artifactLocation: {
				uri: '/folder/file1.txt',
			}
		}
	}]
	yield clone(resultWithRepo)

	// repositoryUri + uriBaseId
	// = href
	resultWithRepo.locations[0].physicalLocation.artifactLocation.uriBaseId = 'SCAN_ROOT'
	yield clone(resultWithRepo)

	// repositoryUri not Azure DevOps
	// = no href
	resultWithRepo.run = {
		versionControlProvenance: [{
			repositoryUri: 'https://github.com',
		}]
	} as Run
	yield clone(resultWithRepo)
}

// TODO: Test highlighting.
export function PathCellDemo() {
	const style = {
		border: '1px dotted black',
		margin: 8,
		padding: 8,
		width: 300,
	}
	return <>
		{[...demoResults()].map((result, i) => <div key={i} style={style}>
			{renderPathCell(result)}
		</div>)}
	</>
}
