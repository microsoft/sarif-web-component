import { join } from 'path-browserify'
import { Region, Run } from 'sarif'

function getHostname(url: string | undefined): string | undefined {
	if (!url) return undefined
	try {
		return new URL(url).hostname
	} catch (_) {
		return undefined
	}
}

// TODO: Account for URI joins (normalizing slashes).
export function getRepoUri(uri: string | undefined, run: Run, region?: Region | undefined): string | undefined {
	if (!uri) return undefined

	const versionControlDetails = run.versionControlProvenance?.[0]
	if (!versionControlDetails) return undefined // Required.

	const { repositoryUri, revisionId } = versionControlDetails
	const hostname = getHostname(repositoryUri)
	if (!hostname) return undefined // Required.

	if (hostname.endsWith('azure.com') || hostname?.endsWith('visualstudio.com')) {
		// Examples:
		// https://dev.azure.com/microsoft/sarif-web-component/_git/sarif-web-component?path=%2F.gitignore
		// https://dev.azure.com/microsoft/sarif-web-component/_git/sarif-web-component?path=%2F.gitignore&version=GCd14c42f18766159a7ef6fbb8858ab5ad4f0b532a
		let repoUri = revisionId
			? `${repositoryUri}?path=${encodeURIComponent(uri)}&version=GC${revisionId}`
			: `${repositoryUri}?path=${encodeURIComponent(uri)}`
		if (region?.startLine) { // lines and columns are 1-based, so it is safe to to use simple truthy checks.
			// First three params required even in the most basic case (highlight a single line).
			// If there is no endColumn, we +1 the lineEnd to select the entire line.
			repoUri += `&line=${region!.startLine}`
			repoUri += `&lineEnd=${region!.endLine ?? (region!.startLine + (region!.endColumn ? 0 : 1))}`
			repoUri += `&lineStartColumn=${region!.startColumn ?? 1}`
			if (region?.endColumn) {
				repoUri += `&lineEndColumn=${region!.endColumn}`
			}
		}
		return repoUri
	}

	if (hostname.endsWith('github.com')) {
		// Examples:
		// https://github.com/microsoft/sarif-web-component/blob/main/.gitignore
		// https://github.com/microsoft/sarif-web-component/blob/d14c42f18766159a7ef6fbb8858ab5ad4f0b532a/.gitignore
		// https://github.com/microsoft/sarif-web-component/blob/d14c42f18766159a7ef6fbb8858ab5ad4f0b532a/.gitignore#L1
		let repoUri = join(`${repositoryUri}/blob/${revisionId ?? 'main'}`, uri)
		if (region?.startLine) { // `startLine` is 1-based.
			repoUri += `#L${region!.startLine}`
		}
		return repoUri
	}

	return undefined // Unsupported host.
}
