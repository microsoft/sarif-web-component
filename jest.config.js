module.exports = {
	// 10x perf improvement, see:
	// https://github.com/kulshekhar/ts-jest/issues/1044
	// Consider ts-jest isolatedModules for more perf.
	maxWorkers: 1,

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
