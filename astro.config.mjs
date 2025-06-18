import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import lit from '@astrojs/lit';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	sitemap: true,
	integrations: [sitemap(), mdx(), lit(), icon(), partytown()], // Add renderers to the config
	i18n: {
		locales: ['es', 'eu'],
		defaultLocale: 'es',
	},
	routing: {
		prefixDefaultLocale: true,
	},
});
