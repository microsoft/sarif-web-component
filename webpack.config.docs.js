const common = require('./webpack.config.common')

module.exports = {
	...common,
	mode: 'production',
	entry: {
		'docs': './docs-components/Index.tsx',
	},
	output: {
		path: __dirname,
		filename: '[name]/index.js',
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	externals: {
		'react': 'React',
		'react-dom': 'ReactDOM',
	},
}
