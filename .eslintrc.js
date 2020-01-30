/**
 * @description
 * Main ESLint config. Most rules are inherited from the `extends` key,
 * but our own overrides live within the `rules` key. Ultimately, the
 * rules that are enforced should add value and consistency to our code -
 * not to inhibit one's ability to get work done and be productive.
 *
 * NOTE: If altering `rules`, leave a small explanation for why the change
 * was made. This config once lived within our package.json, but that
 * restricted us from adding comments to explain certain rules.
 *
 * @see https://eslint.org/docs/user-guide/configuring
 */
module.exports = {
	parser: 'babel-eslint',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
			modules: true,
		},
	},
	extends: ['eslint:recommended', 'prettier'],
	plugins: ['import', 'prettier', 'jsx-a11y'],
	rules: {
		'prettier/prettier': 'error',
		'arrow-body-style': 0,
		'class-methods-use-this': 0,
		'comma-dangle': [
			'error',
			{
				arrays: 'only-multiline',
				objects: 'only-multiline',
				imports: 'only-multiline',
				exports: 'only-multiline',
				functions: 'only-multiline',
			},
		],
		//  If all variables in destructuring should be const, this rule warns the variables. Otherwise, ignores them.
		'prefer-const': [
			'warn',
			{
				destructuring: 'all',
			},
		],
		'import/prefer-default-export': 0,
		'jsx-a11y/no-noninteractive-element-interactions': 0,
		'jsx-a11y/label-has-associated-control': [
			2,
			{
				assert: 'either',
			},
		],
		'jsx-a11y/label-has-for': 0,
		'linebreak-style': 0,
		// This is perfectly valid syntax...
		'no-plusplus': 0,
		'no-console': 0,
		'no-lonely-if': 0,
		'no-restricted-globals': 1,
		'no-extra-boolean-cast': 0,
		'no-param-reassign': [
			'error',
			{
				props: false,
			},
		],
		'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
		'no-underscore-dangle': 0,
	},
	settings: {
		'import/resolver': {
			node: {
				paths: ['src'],
			},
		},
	},
	env: {
		browser: true,
		node: true,
		es6: true,
		mocha: true,
	},
};
