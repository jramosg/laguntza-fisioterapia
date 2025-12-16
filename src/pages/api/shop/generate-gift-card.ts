import type { APIRoute } from 'astro';
import { generateGiftCardCode, generateGiftCardPDF, saveGiftCard, sendGiftCardEmail } from '@utils/giftCard';

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { 
			amount, 
			sessions,
			recipientName, 
			recipientEmail, 
			senderName, 
			senderEmail, 
			giftMessage,
			paymentIntentId 
		} = body;

		// Generate unique code
		const code = generateGiftCardCode();

		// Calculate expiry date (12 months from now)
		const expiryDate = new Date();
		expiryDate.setFullYear(expiryDate.getFullYear() + 1);

		// Gift card data
		const giftCardData = {
			code,
			amount: parseInt(amount),
			sessions: parseInt(sessions) || Math.floor(parseInt(amount) / 45),
			recipientName,
			recipientEmail: recipientEmail || '',
			senderName,
			senderEmail,
			giftMessage: giftMessage || '',
			paymentIntentId,
			createdAt: new Date().toISOString(),
			expiryDate: expiryDate.toISOString(),
			used: false,
			usedAt: null,
		};

		// Save gift card to database/storage
		await saveGiftCard(giftCardData);

		// Generate PDF
		const pdfBuffer = await generateGiftCardPDF(giftCardData);

		// Send email to sender
		await sendGiftCardEmail({
			to: senderEmail,
			recipientName,
			senderName,
			amount: giftCardData.amount,
			code,
			expiryDate: expiryDate.toISOString(),
			pdfBuffer,
		});

		// If recipient email is provided, send them a notification too
		if (recipientEmail) {
			await sendGiftCardEmail({
				to: recipientEmail,
				recipientName,
				senderName,
				amount: giftCardData.amount,
				code,
				expiryDate: expiryDate.toISOString(),
				pdfBuffer,
				isRecipient: true,
				giftMessage,
			});
		}

		// Return PDF URL (could be a signed URL from cloud storage)
		// For now, we'll return a data URL or endpoint to download
		const pdfBase64 = pdfBuffer.toString('base64');
		const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

		return new Response(
			JSON.stringify({ 
				success: true, 
				code,
				pdfUrl,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err: any) {
		console.error('Gift card generation error:', err);
		return new Response(
			JSON.stringify({ error: err.message || 'Gift card generation error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

export const prerender = false;
