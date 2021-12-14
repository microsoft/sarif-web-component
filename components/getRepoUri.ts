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
// TODO: Handle regions beyond `startLine`.
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
		if (region?.startLine) { // `startLine` is 1-based.
			// All three params required just to highlight a single line.
			repoUri += `&line=${region!.startLine}`
			repoUri += `&lineEnd=${region!.startLine + 1}`
			repoUri += `&lineStartColumn=1`
		}
		return repoUri
	}

	if (hostname.endsWith('github.com')) {
		// Examples:
		// https://github.com/microsoft/sarif-web-component/blob/main/.gitignore
		// https://github.com/microsoft/sarif-web-component/blob/d14c42f18766159a7ef6fbb8858ab5ad4f0b532a/.gitignore
		// https://github.com/microsoft/sarif-web-component/blob/d14c42f18766159a7ef6fbb8858ab5ad4f0b532a/.gitignore#L1
		let repoUri = `${repositoryUri}/blob/${revisionId ?? 'main'}${uri}`
		if (region?.startLine) { // `startLine` is 1-based.
			repoUri += `#L${region!.startLine}`
		}
		return repoUri
	}

	return undefined // Unsupported host.
}
