export const languagePreferenceKey = 'laguntza-language';

export function rememberLanguage(language: string) {
	if (language !== 'es' && language !== 'eu') return;
	try {
		window.localStorage.setItem(languagePreferenceKey, language);
	} catch {
		// Language links still work when browser storage is unavailable.
	}
}
