const common = require('./webpack.config.common')

module.exports = {
	...common,
	mode: 'production',
	entry: {
		'dist': './components/Viewer.tsx',
	},
	optimization: {
		// Blocking Snowpack import thus disabling `minimize`.
		minimize: false,
	},
	output: {
		path: __dirname,
		filename: '[name]/index.js',
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	externals: {
		'react': {
			commonjs: 'react',
			commonjs2: 'react',
			amd: 'React',
			root: 'React',
		},
		'react-dom': {
			commonjs: 'react-dom',
			commonjs2: 'react-dom',
			amd: 'ReactDOM',
			root: 'ReactDOM',
		}  
	} 
}
