module.exports = {
	resolve: {
		extensions: ['.js', '.ts', '.tsx'] // .js is necessary for transitive imports
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
	performance: {
		// azure-devops-ui is the majority of the payload
		// and is needed on boot (thus cannot be lazy loaded).
		maxAssetSize: 820 * 1024,
		maxEntrypointSize: 820 * 1024,
	},
	stats: 'minimal', // If left on will disrupt `webpack --profile`.
}
