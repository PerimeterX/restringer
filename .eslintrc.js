module.exports = {
	env: {
		browser: true,
		node: true,
		commonjs: true,
		es2021: true,
	},
	extends: 'eslint:recommended',
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		indent: [
			'error',
			'tab',
			{
				SwitchCase: 1
			},
		],
		'linebreak-style': [
			'error',
			'unix',
		],
		quotes: [
			'error',
			'single',
			{
				allowTemplateLiterals: true
			},
		],
		semi: [
			'error',
			'always',
		],
		'no-empty': [
			'off',
		],
	},
};
