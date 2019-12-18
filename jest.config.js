module.exports = {
	// testEnvironment: 'node',
	moduleNameMapper: {
		'\\.(png|s?css)$': 'identity-obj-proxy'
	},
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.js?$': 'babel-jest',
	},
	transformIgnorePatterns: [
		'node_modules/(?!azure-devops-ui)/'
	]
}
