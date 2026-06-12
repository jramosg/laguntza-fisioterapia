import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	prefetch: {
		defaultStrategy: 'viewport'
	},
	sitemap: true,
	integrations: [
		sitemap({
			filter: page =>
				page !== 'https://laguntzafisioterapia.com/' &&
				!page.startsWith('https://laguntzafisioterapia.com/admin'),
			i18n: {
				defaultLocale: 'es',
				locales: {
					es: 'es-ES',
					eu: 'eu-ES'
				}
			}
		}),
		icon()
	],
	i18n: {
		locales: ['es', 'eu'],
		defaultLocale: 'es'
	},
	routing: {
		prefixDefaultLocale: true
	},
	image: { layout: 'constrained' }
});
