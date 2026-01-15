import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	sitemap: true,
	integrations: [
		sitemap({
			i18n: {
				defaultLocale: 'es',
				locales: {
					es: 'es-ES',
					eu: 'eu-ES',
				}
			}
		}),
		icon(),
		partytown()
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
