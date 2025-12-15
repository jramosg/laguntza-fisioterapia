import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import node from '@astrojs/node';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	sitemap: true,
	output: 'server',
	adapter: node({
		mode: 'standalone'
	}),
	integrations: [sitemap(), icon(), partytown()], // Add renderers to the config
	i18n: {
		locales: ['es', 'eu'],
		defaultLocale: 'es'
	},
	routing: {
		prefixDefaultLocale: true
	},
	image: { layout: 'constrained' }
});
