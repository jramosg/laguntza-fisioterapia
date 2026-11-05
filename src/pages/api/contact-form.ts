import type { APIRoute } from 'astro';
import { LEGACY_CONTACT_ENABLED } from 'astro:env/server';
import { parseLegacyContact } from '../../server/legacy-contact.ts';
import {
	submitContact,
	ContactSubmissionError
} from '../../server/contact-delivery.ts';

export const prerender = false;
const origins = new Set([
	'https://laguntzafisioterapia.com',
	'https://www.laguntzafisioterapia.com',
	'https://laguntza-fisioterapia.netlify.app'
]);
const maxBody = 22 * 1024 * 1024;

const handle: APIRoute = async context => {
	if (!LEGACY_CONTACT_ENABLED) return new Response(null, { status: 404 });
	const origin = context.request.headers.get('origin') || '';
	const headers: Record<string, string> = {
		'Cache-Control': 'no-store',
		Vary: 'Origin',
		'X-Robots-Tag': 'noindex'
	};
	if (!origins.has(origin))
		return Response.json({ success: false }, { status: 403, headers });
	headers['Access-Control-Allow-Origin'] = origin;
	if (context.request.method === 'OPTIONS')
		return new Response(null, {
			status: 204,
			headers: {
				...headers,
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '600'
			}
		});
	if (
		!context.request.headers
			.get('content-type')
			?.toLowerCase()
			.startsWith('application/json')
	)
		return Response.json({ success: false }, { status: 415, headers });
	if (Number(context.request.headers.get('content-length')) > maxBody)
		return Response.json({ success: false }, { status: 413, headers });
	let input;
	try {
		input = await parseLegacyContact(await context.request.json());
	} catch {
		return Response.json({ success: false }, { status: 400, headers });
	}
	try {
		const result = await submitContact(input, context.clientAddress);
		return Response.json({ success: true, ...result }, { headers });
	} catch (error) {
		return Response.json(
			{ success: false },
			{
				status: error instanceof ContactSubmissionError ? error.status : 500,
				headers
			}
		);
	}
};
export const POST = handle;
export const OPTIONS = handle;
