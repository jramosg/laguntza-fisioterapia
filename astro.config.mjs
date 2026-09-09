import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'node:child_process';
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
			// lastmod is the one sitemap field Google actually uses, and only
			// while it stays trustworthy. Stamping every page with build time
			// would claim all 18 pages changed on every deploy and get the
			// field ignored, so each URL reports the real commit date of the
			// files that produce it.
			lastmod: undefined,
			serialize(item) {
				const modified = lastModifiedFor(item.url);
				if (modified) item.lastmod = modified;
				item.changefreq = 'monthly';
				// Google ignores priority outright; Bing and others still read
				// it. Values describe the site's own hierarchy: the homepage
				// first, then the services hub, then individual services.
				const path = new URL(item.url).pathname.replace(/\/$/, '');
				const depth = path.split('/').filter(Boolean).length;
				if (depth <= 1) item.priority = 1;
				else if (path.endsWith('/services')) item.priority = 0.9;
				else if (path.includes('/services/')) item.priority = 0.8;
				else item.priority = 0.7;
				return item;
			},
			filter: page => page !== 'https://laguntzafisioterapia.com/',
			i18n: {
				defaultLocale: 'es',
				// These are the hreflang codes the sitemap emits, and they have
				// to match what the pages themselves declare. The HTML says
				// "es" and "eu"; emitting "es-ES" and "eu-ES" here made the
				// sitemap and the markup disagree about the same URLs, which
				// is the kind of conflicting signal Google resolves by
				// ignoring hreflang altogether.
				locales: {
					es: 'es',
					eu: 'eu'
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

/**
 * Last commit date of the files behind a URL, as an ISO string.
 *
 * Both halves matter: the route file and the translation file, because the
 * prose for every page lives in src/i18n/ui.ts. Whichever changed last is
 * when the page really changed.
 */
function lastModifiedFor(url) {
	const path = new URL(url).pathname
		.replace(/^\/(es|eu)/, '')
		.replace(/\/$/, '');
	const route = path === '' ? 'index' : path.replace(/^\//, '');
	const candidates = [`src/pages/[lang]/${route}.astro`, 'src/i18n/ui.ts'];
	const dates = candidates
		.map(file => {
			try {
				return execSync(`git log -1 --format=%cI -- "${file}"`, {
					encoding: 'utf8',
					stdio: ['ignore', 'pipe', 'ignore']
				}).trim();
			} catch {
				return '';
			}
		})
		.filter(Boolean)
		.sort();
	return dates.at(-1) || undefined;
}
