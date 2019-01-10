// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as React from 'react'

export function Hi({ term, children }) {
    if (!children) return null
    term = term && term.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&").replace(/\*/g, ".*")
    return (!term || term.length <= 1)
        ? children
        : children
            .split(new RegExp(`(${term})`, 'i'))
            .map((word, i) => i % 2 === 1 ? <mark key={i}>{word}</mark> : word)
}
