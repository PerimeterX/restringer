import globals from 'globals';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [
	{
		ignores: [
			'tests/resources',
			'**/jquery*.js',
			'**/*tmp*.*',
			'**/*tmp*/',
			"eslint.config.js",
			"node_modules/",
		],
	},
	...compat.extends('eslint:recommended'),
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.commonjs,
			},
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
		rules: {
			indent: ['error', 'tab', {
				SwitchCase: 1,
			}],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single', {
				allowTemplateLiterals: true,
			}],
			semi: ['error', 'always'],
			'no-empty': ['off'],
		},
	}];