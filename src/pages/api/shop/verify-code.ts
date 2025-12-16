import type { APIRoute } from 'astro';
import { verifyGiftCard, formatDate } from '@utils/giftCard';

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { code } = body;

		if (!code) {
			return new Response(
				JSON.stringify({ valid: false, error: 'Code is required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Verify the code format
		const codeRegex = /^LF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
		if (!codeRegex.test(code.toUpperCase())) {
			return new Response(
				JSON.stringify({ valid: false, error: 'Invalid code format' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Look up the gift card
		const giftCard = await verifyGiftCard(code.toUpperCase());

		if (!giftCard) {
			return new Response(
				JSON.stringify({ valid: false }),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Check if expired
		const isExpired = new Date(giftCard.expiryDate) < new Date();

		return new Response(
			JSON.stringify({
				valid: true,
				amount: giftCard.amount,
				sessions: giftCard.sessions,
				expiryDate: formatDate(giftCard.expiryDate),
				used: giftCard.used,
				expired: isExpired,
				recipientName: giftCard.recipientName,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err: any) {
		console.error('Verification error:', err);
		return new Response(
			JSON.stringify({ valid: false, error: 'Verification error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

export const prerender = false;
