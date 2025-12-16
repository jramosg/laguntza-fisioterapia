import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
	apiVersion: '2025-02-24.acacia',
});

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { amount, recipientName, recipientEmail, senderName, senderEmail, giftMessage } = body;

		// Validate amount
		const amountInCents = parseInt(amount) * 100;
		if (isNaN(amountInCents) || amountInCents < 3000 || amountInCents > 50000) {
			return new Response(
				JSON.stringify({ error: 'Invalid amount. Must be between 30€ and 500€' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Validate required fields
		if (!recipientName || !senderName || !senderEmail) {
			return new Response(
				JSON.stringify({ error: 'Missing required fields' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Create PaymentIntent
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountInCents,
			currency: 'eur',
			automatic_payment_methods: {
				enabled: true,
			},
			metadata: {
				type: 'gift_card',
				recipientName,
				recipientEmail: recipientEmail || '',
				senderName,
				senderEmail,
				giftMessage: giftMessage || '',
			},
			receipt_email: senderEmail,
			description: `Vale Regalo Laguntza Fisioterapia - ${amount}€`,
		});

		return new Response(
			JSON.stringify({ clientSecret: paymentIntent.client_secret }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err: any) {
		console.error('Stripe error:', err);
		return new Response(
			JSON.stringify({ error: err.message || 'Payment processing error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

export const prerender = false;
