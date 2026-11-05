export const languagePreferenceKey = 'laguntza-language';

export function rememberLanguage(language: string) {
	if (language !== 'es' && language !== 'eu') return;
	try {
		document.cookie = `${languagePreferenceKey}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
	} catch {
		// Explicit language URLs also work when cookies are unavailable.
	}
	try {
		window.localStorage.setItem(languagePreferenceKey, language);
	} catch {
		// Language links still work when browser storage is unavailable.
	}
}
