const js = require("@eslint/js");
const globals = require("globals");
const pluginReact = require("eslint-plugin-react");
const jsdoc = require("eslint-plugin-jsdoc");

const sharedRules = { "no-unused-vars": "error" };
const ignoreList = [
	"**/*.config.js",
	"**/*.config.{mjs,cjs}",
	"webpack.config.js",
	"build/**",
	"node_modules/**",
	"logs/**",
	"StellarMateShared/**",
	"public/**",
	"docs/**",
];

module.exports = [
	{
		...js.configs.recommended,
		ignores: [...ignoreList],
		plugins: {
			jsdoc,
		},
		rules: {
			"jsdoc/check-access": 1,
			"jsdoc/check-alignment": 1,
			"jsdoc/check-indentation": 1,
			"jsdoc/check-line-alignment": 1,
			"jsdoc/check-template-names": 1,
			"jsdoc/check-property-names": 1,
			"jsdoc/check-syntax": 1,
			"jsdoc/check-tag-names": 1,
			"jsdoc/check-types": 1,
			"jsdoc/check-values": 1,
			"jsdoc/empty-tags": 1,
			"jsdoc/implements-on-classes": 1,
			"jsdoc/multiline-blocks": 1,
			"jsdoc/no-bad-blocks": 1,
			"jsdoc/require-asterisk-prefix": 1,
			"jsdoc/require-description-complete-sentence": 1,
			"jsdoc/require-hyphen-before-param-description": 1,
			"jsdoc/require-jsdoc": 1,
			"jsdoc/require-param": 1,
			"jsdoc/require-param-description": 1,
			"jsdoc/require-param-name": 1,
			"jsdoc/require-param-type": 1,
			"jsdoc/require-property": 1,
			"jsdoc/require-property-description": 1,
			"jsdoc/require-property-name": 1,
			"jsdoc/require-property-type": 1,
			"jsdoc/require-returns": 1,
			"jsdoc/require-returns-check": 1,
			"jsdoc/require-returns-description": 1,
			"jsdoc/require-returns-type": 1,
			"jsdoc/require-template": 1,
			"jsdoc/require-throws": 1,
			"jsdoc/require-yields": 1,
			"jsdoc/require-yields-check": 1,
			"jsdoc/sort-tags": 1,
			"jsdoc/valid-types": 1,
		},
	},
	{
		name: "client",
		files: [
			"src/client/**/*.{js,mjs,cjs,jsx}",
			"landing-page/**/*.{js,mjs,cjs,jsx}",
		],
		plugins: { react: pluginReact },
		rules: {
			...sharedRules,
			"react/jsx-uses-react": "error",
			"react/jsx-uses-vars": "error",
			"react/hook-use-state": "error",
			"react/jsx-curly-brace-presence": "warn",
			"react/jsx-key": "error",
			"react/jsx-no-duplicate-props": "error",
			"react/jsx-no-undef": "error",
			"react/jsx-no-useless-fragment": "error",
			"react/jsx-pascal-case": "warn",
		},
		languageOptions: {
			globals: { ...globals.browser },
			parserOptions: {
				ecmaFeatures: { jsx: true },
				parser: "babel-eslint",
			},
		},
	},
	{
		name: "server",
		files: ["src/server/**/*.{js,mjs,cjs}"],
		languageOptions: {
			globals: { ...globals.node },
			sourceType: "commonjs",
		},
	},
];
