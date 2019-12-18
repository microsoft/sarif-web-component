// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// At least one export needed otherwise:
// Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.
export default true

declare global {
	interface Array<T> {
		sorted(sortf): Array<T>
	}
}

Array.prototype.sorted = function(sortf) {
	const copy = this.slice()
	copy.sort(sortf)
	return copy
}
