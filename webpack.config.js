const path = require('path')
const common = require('./webpack.config.common')

module.exports = {
	...common,
	mode: 'development',
	entry: './index.tsx',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'index.js',
	},
	devServer : {
		publicPath: '/dist',
		//https: true,
		//host: '0.0.0.0', // Necessary to server outside localhost
		stats: 'none',
	},
}
