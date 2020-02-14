const path = require('path')

module.exports = {
	entry: './components/Viewer.tsx',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'index.js',
		libraryTarget: 'umd',
		globalObject: 'this',
	},
	mode: 'production',
	resolve: {
		extensions: ['.js', '.ts', '.tsx'] // .js is neccesary for transitive imports
	},
	externals: {
		'react': 'React',
		'react-dom': 'ReactDOM',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.s?css$/,
				use: ['style-loader', 'css-loader', 'sass-loader']
			},
			{ test: /\.png$/, use: 'url-loader' },
			{ test: /\.woff$/, use: 'url-loader' },
		]
	},
	devServer : {
		publicPath: '/dist',
		host: '0.0.0.0', // Neccesary to server outside localhost
		port: 8087,
		stats: 'none',
	},
}
