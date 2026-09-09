import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	trailingSlash: 'always',
	prefetch: {
		defaultStrategy: 'viewport'
	},
	sitemap: true,
	integrations: [
		sitemap({
			// Without lastmod the sitemap gives Google no freshness signal, and
			// a URL it has only discovered stays low in the crawl queue. Build
			// time is the honest value for a fully static site.
			lastmod: new Date(),
			// Service pages are the commercial pages and the ones currently
			// stuck as "discovered, not indexed", so they get the highest
			// priority after the homepage.
			serialize(item) {
				if (item.url.includes('/services/')) {
					item.priority = item.url.replace(/\/$/, '').endsWith('/services')
						? 0.8
						: 0.9;
					item.changefreq = 'monthly';
				} else {
					item.priority = 0.7;
					item.changefreq = 'monthly';
				}
				return item;
			},
			filter: page => page !== 'https://laguntzafisioterapia.com/',
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
