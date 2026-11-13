import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	site: 'https://laguntzafisioterapia.com/',
	trailingSlash: 'always',
	compressHTML: true,
	// Inline the stylesheets: two fewer render-blocking requests on
	// first paint.
	build: { inlineStylesheets: 'always' },
	adapter: node({ mode: 'standalone', bodySizeLimit: 16 * 1024 * 1024 }),
	security: {
		actionBodySizeLimit: 16 * 1024 * 1024,
		allowedDomains: [
			{ hostname: 'laguntzafisioterapia.com', protocol: 'https' },
			{ hostname: 'www.laguntzafisioterapia.com', protocol: 'https' },
			{ hostname: 'test.laguntzafisioterapia.com', protocol: 'https' },
			{ hostname: 'localhost' },
			{ hostname: '127.0.0.1' }
		]
	},
	env: {
		schema: {
			LEGAL_NIF: envField.string({
				context: 'server',
				access: 'secret',
				optional: true
			}),
			EMAIL_ENABLED: envField.boolean({
				context: 'server',
				access: 'secret',
				default: false
			}),
			RESEND_API_KEY: envField.string({
				context: 'server',
				access: 'secret',
				optional: true
			}),
			FROM_EMAIL: envField.string({
				context: 'server',
				access: 'secret',
				optional: true
			}),
			COMPANY_EMAIL: envField.string({
				context: 'server',
				access: 'secret',
				optional: true
			}),
			BCC_EMAIL: envField.string({
				context: 'server',
				access: 'secret',
				optional: true
			})
		}
	},
	prefetch: {
		defaultStrategy: 'viewport'
	},
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
		defaultLocale: 'es',
		routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false }
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
	// Pages without a route file of their own come from the dynamic
	// treatment route, whose prose lives in src/config/treatments.ts.
	const routeFile = `src/pages/[lang]/${route}.astro`;
	const candidates = existsSync(routeFile)
		? [routeFile, 'src/i18n/ui.ts']
		: [
				'src/pages/[lang]/services/[treatment].astro',
				'src/config/treatments.ts'
			];
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
