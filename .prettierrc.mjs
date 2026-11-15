/** @type {import("prettier").Config} */
export default {
	useTabs: true,
	semi: true,
	singleQuote: true,
	arrowParens: 'avoid',
	plugins: ['prettier-plugin-astro'],
	astroCompressHTML: 'html',
	trailingComma: 'none',
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro'
			}
		}
	]
};
