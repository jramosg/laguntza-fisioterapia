import type { APIRoute } from 'astro';
import { languagePreferenceKey } from '@i18n/preference';
import { negotiateLanguage } from '@i18n/negotiation';

export const prerender = false;

export const GET: APIRoute = ({ request, cookies, url }) => {
	const language = negotiateLanguage(
		cookies.get(languagePreferenceKey)?.value,
		request.headers.get('accept-language')
	);
	return new Response(null, {
		status: 302,
		headers: {
			Location: `/${language}/${url.search}`,
			'Cache-Control': 'private, no-store',
			Vary: 'Cookie, Accept-Language'
		}
	});
};
