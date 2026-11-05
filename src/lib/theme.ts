export type Theme = 'light' | 'dark';
export const themeStorageKey = 'theme';
export const themeChangeEvent = 'laguntza:theme-change';

let manualTheme: Theme | null = null;
let initialized = false;

function savedTheme(): Theme | null {
	try {
		const saved = window.localStorage.getItem(themeStorageKey);
		return saved === 'light' || saved === 'dark' ? saved : null;
	} catch {
		return null;
	}
}

export function preferredTheme(): Theme {
	return (
		manualTheme ||
		savedTheme() ||
		(window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light')
	);
}

function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	document.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: theme }));
}

export function chooseTheme(theme: Theme) {
	manualTheme = theme;
	try {
		window.localStorage.setItem(themeStorageKey, theme);
	} catch {
		// Keep the choice for this visit when persistent storage is blocked.
	}
	applyTheme(theme);
}

export function initializeTheme() {
	if (initialized) return;
	initialized = true;
	applyTheme(preferredTheme());
	document.addEventListener('astro:before-swap', event => {
		event.newDocument.documentElement.dataset.theme = preferredTheme();
	});
	document.addEventListener('astro:after-swap', () =>
		applyTheme(preferredTheme())
	);
	window
		.matchMedia('(prefers-color-scheme: dark)')
		.addEventListener('change', () => {
			if (!manualTheme && !savedTheme()) applyTheme(preferredTheme());
		});
	window.addEventListener('storage', event => {
		if (event.key === themeStorageKey || event.key === null) {
			manualTheme = null;
			applyTheme(preferredTheme());
		}
	});
}
