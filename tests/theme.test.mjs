import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/lib/theme.ts', import.meta.url), 'utf8')
).replace(/^export /gm, '');
const bootstrap = readFileSync(
	new URL(
		'../src/components/theme-switcher/ThemeProvider.astro',
		import.meta.url
	),
	'utf8'
).match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)[1];

function browser({ saved, dark = false, blocked = false } = {}) {
	const store = new Map(saved ? [['theme', saved]] : []);
	const media = Object.assign(new EventTarget(), { matches: dark });
	const document = Object.assign(new EventTarget(), {
		documentElement: { dataset: {} }
	});
	const window = Object.assign(new EventTarget(), {
		matchMedia: () => media,
		localStorage: {
			getItem: key => {
				if (blocked) throw new Error('Storage blocked');
				return store.get(key) ?? null;
			},
			setItem: (key, value) => {
				if (blocked) throw new Error('Storage blocked');
				store.set(key, value);
			}
		}
	});
	const api = runInNewContext(
		`${source}\n({ initializeTheme, chooseTheme, preferredTheme });`,
		{ window, document, CustomEvent }
	);
	return { ...api, store, media, document, window };
}

test('uses the system preference until the visitor chooses a theme', () => {
	const b = browser({ dark: true });
	b.initializeTheme();
	assert.equal(b.document.documentElement.dataset.theme, 'dark');
	b.media.matches = false;
	b.media.dispatchEvent(new Event('change'));
	assert.equal(b.document.documentElement.dataset.theme, 'light');
	assert.equal(b.store.size, 0);
});

test('stored manual choice takes precedence over the system', () => {
	const b = browser({ saved: 'light', dark: true });
	b.initializeTheme();
	assert.equal(b.document.documentElement.dataset.theme, 'light');
	b.chooseTheme('dark');
	assert.equal(b.store.get('theme'), 'dark');
	assert.equal(b.document.documentElement.dataset.theme, 'dark');
});

test('sets the incoming document theme before Astro swaps it', () => {
	const b = browser();
	b.initializeTheme();
	b.chooseTheme('dark');
	const next = { documentElement: { dataset: {} } };
	const event = new Event('astro:before-swap');
	event.newDocument = next;
	b.document.dispatchEvent(event);
	assert.equal(next.documentElement.dataset.theme, 'dark');
});

test('blocked storage keeps a manual choice for the current visit', () => {
	const b = browser({ blocked: true });
	b.initializeTheme();
	b.chooseTheme('dark');
	b.media.dispatchEvent(new Event('change'));
	b.document.documentElement = { dataset: {} };
	b.document.dispatchEvent(new Event('astro:after-swap'));
	assert.equal(b.document.documentElement.dataset.theme, 'dark');
});

test('rejects invalid saved values and initializes event listeners only once', () => {
	const b = browser({ saved: 'invalid' });
	b.initializeTheme();
	b.initializeTheme();
	let changes = 0;
	b.document.addEventListener('laguntza:theme-change', () => changes++);
	b.document.dispatchEvent(new Event('astro:after-swap'));
	assert.equal(b.document.documentElement.dataset.theme, 'light');
	assert.equal(changes, 1);
});

test('synchronizes a manual preference changed in another tab', () => {
	const b = browser();
	b.initializeTheme();
	b.chooseTheme('dark');
	b.store.set('theme', 'light');
	const event = new Event('storage');
	event.key = 'theme';
	b.window.dispatchEvent(event);
	assert.equal(b.document.documentElement.dataset.theme, 'light');
});

test('the head bootstrap preserves the incoming theme when storage is blocked', () => {
	const b = browser({ blocked: true });
	b.initializeTheme();
	b.chooseTheme('dark');
	runInNewContext(`const themeStorageKey = 'theme';\n${bootstrap}`, b);
	assert.equal(b.document.documentElement.dataset.theme, 'dark');
});

test('the head bootstrap applies the stored choice before client modules run', () => {
	const b = browser({ saved: 'light', dark: true });
	runInNewContext(`const themeStorageKey = 'theme';\n${bootstrap}`, b);
	assert.equal(b.document.documentElement.dataset.theme, 'light');
});
