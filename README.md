
# SARIF Web Component

A React-based component for viewing [SARIF](http://sarifweb.azurewebsites.net/) files. [Try it out](https://sarifviewer.azurewebsites.net/).

## Usage

```
npm install @microsoft/sarif-web-component
```

```js
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Viewer} from 'sarif-web-component'

ReactDOM.render(<Viewer logs={arrayOfLogs} />, document.body.firstChild)
```

## Publishing
Verify `package.json` `name` in case it was modified for development purposes.
```
npm install
npx webpack --config ./webpack.config.npm.js
npm login
npm publish
```

For a scoped non-paid accounts (such as for personal testing), publish would require: `npm publish --access public`.
For a dry-run publish: `npm publish --dry-run`. Careful: the typo `--dryrun` results in a real publish.

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
