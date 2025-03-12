import { ui, defaultLang, Langs } from './ui';

const newLangMap = { es: 'eu', eu: 'es' };

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: string) {
		return ui[lang][key] || key;
	};
}

export function getStaticLangPaths(): { params: { lang: Langs } }[] {
	const langs = Object.keys(ui) as Langs[];

	const toParam = (lang: keyof typeof ui) => ({
		params: { lang },
	});

	return langs.map(toParam);
}

export function switchLanguage(url: URL) {
	const pathParts = url.pathname.split('/');
	const [, lang] = pathParts;

	const newLang = newLangMap[lang];
	if (newLang in ui) {
		pathParts[1] = newLang;
	} else {
		pathParts.splice(1, 0, newLang);
	}

	return pathParts.join('/');
}
