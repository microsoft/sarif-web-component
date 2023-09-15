
[![npm version](https://img.shields.io/npm/v/@microsoft/sarif-web-component.svg?style=flat)](https://www.npmjs.com/package/@microsoft/sarif-web-component)

# SARIF Web Component

A React-based component for viewing [SARIF](https://www.sarif.info) files. [Try it out](https://microsoft.github.io/sarif-web-component/).

## Usage

```
npm install @microsoft/sarif-web-component
```

```js
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Viewer} from '@microsoft/sarif-web-component'

ReactDOM.render(<Viewer logs={arrayOfLogs} />, document.body.firstChild)
```
In the HTML page hosting this component, `<meta http-equiv="content-type" content="text/html; charset=utf-8">` is required to avoid text rendering issues.

## Publishing
Update the package version. Run workflow `Publish`. Make sure Repository secret `NODE_AUTH_TOKEN` exists.

## Publishing (Manual)
In your local clone of this repo, do the following. Double-check `package.json` `name` in case it was modified for development purposes.
```
git pull
npm install
npx webpack --config ./webpack.config.npm.js
npm login
npm publish
```

For a scoped non-paid accounts (such as for personal testing), publish would require: `npm publish --access public`.
For a dry-run publish: `npm publish --dry-run`. Careful: the typo `--dryrun` results in a real publish.

## Publishing (Local/Private)
As needed, run `git pull` and `npm install`. Then...
```
npx webpack --config ./webpack.config.npm.js
npm pack
```
Our convention is to move/keep the tarballs in the `packages` directory.

## Bundle Size Analysis
In `webpack.config.common.js` temporarily disable `stats: 'minimal'`.

```
npx webpack --profile --json > stats.json
npx webpack-bundle-analyzer stats.json
rm stats.json
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
