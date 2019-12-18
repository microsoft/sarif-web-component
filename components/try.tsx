// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'
import {Link} from 'azure-devops-ui/Link'

export const tryLink = (fHref: () => string, inner: string | JSX.Element, className?: string) => {
	try {
		const href = fHref()
		if (!href) throw null
		return <Link
			className={className} // "bolt-table-link bolt-table-inline-link"
			excludeTabStop
			href={fHref()}
			target="_blank">
			{inner}
		</Link>
	}
	catch (e) { return inner }
}

export function tryOr<T = any>(...functions) {
	for (const i in functions) {		
		const func = functions[i]
		if (typeof func !== 'function') return func as T // A non-function constant value.
		try {
			const value = func()
			if (!value) continue
			return value as T
		}
		catch (e) {}
	}
}
