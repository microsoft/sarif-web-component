import {Log, Run, ReportingDescriptor, Result} from 'sarif'

export default [{
	version: "2.1.0",
	runs: [{
		tool: {
			driver: {
				name: "Sample Tool",
				rules: [
					{
						id: 'RULE01',
						name: 'Rule 1 Name',
						helpUri: 'https://github.com/Microsoft/sarif-sdk',
						fullDescription: { text: 'Full description for RuleId 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' },
						relationships: [
							{
								target: {
									id: '??',
									index: 0,
									toolComponent: { index: 0 }
								}
							},
						],
					},
				]
			},
		},
		taxonomies: [
			{
				taxa: [
					{
						name: 'Taxon00',
						helpUri: 'Taxon00/help/uri',
					},
				]
			}
		],
		results: [
			// { // Bare minimum
			//     message: {},
			// },
			{
				ruleId: 'RULE01',
				message: { text: 'Message only. Keyword "location" for testing.' },
				locations: [{
					physicalLocation: { artifactLocation: { uri: 'folder/file3.txt' } },
				}],
				baselineState: 'absent',
				workItemUris: ['http://sarifviewer.azurewebsites.net/'],
			},
			{
				ruleId: 'RULE01/1',
				message: { text: 'Message with basic snippet.' },
				locations: [{
					physicalLocation: {
						artifactLocation: { uri: 'folder/file1.txt', properties: { href: 'http://example.com' } },
						region: {
							snippet: { text: 'Region snippet text only abc\n'.repeat(10) },
						},
					}
				}],
				baselineState: 'new',
				level: 'error',
			},
			{
				ruleId: 'RULE01',
				message: {},
				locations: [{
					physicalLocation: {
						artifactLocation: { uri: 'folder/file2.txt' },
						region: {
							snippet: { text: 'Region snippet text only. No message. def' },
						},
					}
				}],
				baselineState: 'unchanged',
				level: 'note',
			},
			{
				ruleId: 'RULE01',
				message: { text: 'Testing show all.' },
				locations: [{
					physicalLocation: { artifactLocation: { uri: 'folder/file4.txt' } },
				}],
				baselineState: 'new',
			},
			{
				ruleId: 'RULE01',
				message: { text: 'Empty circle for level: none, kind: (undefined).' },
				locations: [{
					physicalLocation: { artifactLocation: { uri: 'folder/file5.txt' } },
				}],
				baselineState: 'new',
				level: 'none',
			},
			{
				ruleId: 'RULE01',
				message: { text: 'Green check for level: none, kind: pass.' },
				locations: [{
					physicalLocation: { artifactLocation: { uri: 'folder/file5.txt' } },
				}],
				baselineState: 'new',
				level: 'none',
				kind: 'pass',
			},

			// Variation in Path.
			{
				ruleId: 'RULE02',
				message: { text: 'No path.' },
				baselineState: 'updated',
				level: 'none',
			},
			{
				ruleId: 'RULE02',
				message: { text: 'Only analysisTarget.' },
				analysisTarget: { uri: 'analysisTarget' }
			},
			{
				ruleId: 'RULE02',
				message: {
					markdown: "Sample [link](https://example.com). Fix any of the following:\n- Element does not have an alt attribute\n- aria-label attribute does not exist or is empty\n- aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty\n- Element has no title attribute or the title attribute is empty\n- Element's default semantics were not overridden with role=\"presentation\"\n- Element's default semantics were not overridden with role=\"none\".",
					text: 'Only analysisTarget.',
				},
				analysisTarget: { uri: 'analysisTarget' }
			},

			// Variations in Snippets.
			{
				ruleId: 'RULE03',
				message: { text: '1. Message with basic snippet and startLine' },
				locations: [{
					physicalLocation: {
						artifactLocation: { uri: 'folder/file.txt' },
						region: {
							snippet: { text: 'Region snippet text only.' },
							startLine: 100,
						},
					}
				}]
			},
			{
				ruleId: 'RULE03',
				message: { text: '2. Message with basic snippet and contextRegion' },
				locations: [{
					physicalLocation: {
						artifactLocation: { uri: 'folder/file.txt' },
						region: {
							snippet: { text: 'Region snippet text only.' },
							startLine: 100,
						},
						contextRegion: {
							snippet: { text: 'aaa\nRegion snippet text only.\nbbb' },
						},
					}
				}]
			},

			// Variations in AXE.
			{
				ruleId: 'RULE04',
				message: { text: '1. AXE-ish location. Typical.' },
				locations: [{
					logicalLocation: { fullyQualifiedName: 'fullyQualifiedName' },
					physicalLocation: {
						artifactLocation: { index: 0 }, // Link to...
						region: {
							snippet: { text: 'Region snippet text only' },
						},
					}
				}]
			},
			{
				ruleId: 'RULE04',
				message: { text: '2. AXE-ish location. No artifact location.' },
				locations: [{
					logicalLocation: { fullyQualifiedName: 'fullyQualifiedName' },
					physicalLocation: {
						region: {
							snippet: { text: 'Region snippet text only' },
						},
					}
				}]
			},
			{
				ruleId: 'RULE04',
				message: { text: '1. AXE-ish location. Typical.' },
				locations: [{
					physicalLocation: {
						artifactLocation: { uri: 'fallback-missing-fullyQualifiedName' },
						region: {
							snippet: { text: 'Region snippet text only' },
						},
					}
				}]
			},
		],
		artifacts: [
			{
				location: { uri: 'indexed/artifact/uri' },
				description: { text: 'Some really long text for indexed/artifact/uri' },
			},
		]
	}],
},
{
	version: "2.1.0",
	runs: [{
		tool: {
			driver: {
				name: "Sample Tool 2"
			}
		},
		results: [
			{ // Bare minimum
				message: {},
			},
		],
	},
	{
		tool: {
			driver: {
				name: "Sample Tool 3"
			}
		},
		results: [
			{ // Bare minimum
				message: {},
			},
		],
	}]
}] as Log[]