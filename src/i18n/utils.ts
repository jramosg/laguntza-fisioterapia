import { ui, defaultLang, Langs } from './ui';

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: keyof (typeof ui)[typeof defaultLang]) {
		return ui[lang][key] || key;
	};
}

export function getStaticLangPaths(): { params: { lang: Langs } }[] {
	const langs = Object.keys(ui) as (Langs)[];

	const toParam = (lang: keyof typeof ui) => ({
		params: { lang },
	});

	return langs.map(toParam);
}