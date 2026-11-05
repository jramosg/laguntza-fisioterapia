import type { APIRoute } from 'astro';
import { EMAIL_ENABLED, LEGACY_CONTACT_ENABLED } from 'astro:env/server';

export const prerender = false;
export const GET: APIRoute = () =>
	Response.json(
		{
			status: 'ok',
			emailEnabled: EMAIL_ENABLED,
			legacyContactEnabled: LEGACY_CONTACT_ENABLED
		},
		{ headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
	);
