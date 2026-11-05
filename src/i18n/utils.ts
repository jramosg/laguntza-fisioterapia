import { ui, defaultLang, type Langs } from './ui';

const newLangMap: Record<Langs, Langs> = { es: 'eu', eu: 'es' };

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	const dictionary: Readonly<Record<string, string>> = ui[lang];
	return function t(key: string) {
		return dictionary[key] || key;
	};
}

export function getStaticLangPaths(): { params: { lang: Langs } }[] {
	const langs = Object.keys(ui) as Langs[];

	const toParam = (lang: keyof typeof ui) => ({
		params: { lang }
	});

	return langs.map(toParam);
}

export function switchLanguage(url: URL) {
	const pathParts = url.pathname.split('/');
	const [, lang] = pathParts;

	if (lang === 'es' || lang === 'eu') {
		pathParts[1] = newLangMap[lang];
	} else {
		pathParts.splice(1, 0, defaultLang);
	}

	return pathParts.join('/');
}
