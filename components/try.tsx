import * as React from 'react'

export const tryLink = (fHref: () => string, inner: string | JSX.Element) => {
	try {
		const href = fHref()
		if (!href) throw null
		return <a href={fHref()} target="_blank">{inner}</a>
	}
	catch (e) { return inner }
}

export const tryOr = (render, _default?) => {
	try       { return render() }
	catch (e) { return _default && _default() }
}