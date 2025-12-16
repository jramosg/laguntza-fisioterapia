import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import Stripe from 'stripe';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize Stripe
const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '', {
	apiVersion: '2025-02-24.acacia' as any,
});

// Initialize Resend
const resend = new Resend(import.meta.env.RESEND_API_KEY || '');

// Types
interface GiftCardRecord {
	code: string;
	sessions: number;
	amount: number;
	recipientName: string;
	recipientEmail: string;
	senderName: string;
	senderEmail: string;
	message: string;
	paymentIntentId: string;
	securityHash: string;
	createdAt: string;
	expiresAt: string;
	used: boolean;
	usedAt: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = crypto.randomBytes(8);
	let code = 'LF-';
	for (let i = 0; i < 8; i++) {
		if (i === 4) code += '-';
		code += chars[bytes[i] % chars.length];
	}
	return code;
}

function generateHash(code: string, amount: number, createdAt: string): string {
	const secret = import.meta.env.GIFT_CARD_SECRET || 'laguntza-default-secret';
	return crypto
		.createHmac('sha256', secret)
		.update(`${code}:${amount}:${createdAt}`)
		.digest('hex')
		.substring(0, 12)
		.toUpperCase();
}

async function getStoragePath(): Promise<string> {
	const dir = path.join(process.cwd(), 'data');
	await fs.mkdir(dir, { recursive: true });
	return path.join(dir, 'gift-cards.json');
}

async function loadGiftCards(): Promise<Record<string, GiftCardRecord>> {
	try {
		const storagePath = await getStoragePath();
		const content = await fs.readFile(storagePath, 'utf-8');
		return JSON.parse(content);
	} catch {
		return {};
	}
}

async function saveGiftCards(data: Record<string, GiftCardRecord>): Promise<void> {
	const storagePath = await getStoragePath();
	await fs.writeFile(storagePath, JSON.stringify(data, null, 2));
}

// Email HTML template
function getEmailHtml(data: {
	recipientName: string;
	senderName: string;
	sessions: number;
	amount: number;
	code: string;
	expiresAt: string;
	message?: string;
	isRecipient?: boolean;
}): string {
	const expiryDate = new Date(data.expiresAt).toLocaleDateString('es-ES', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});

	if (data.isRecipient) {
		return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
		.code-box { background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
		.code { font-family: monospace; font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 2px; }
		.message-box { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; font-style: italic; }
		.footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
	</style>
</head>
<body>
	<div class="header">
		<h1>Has recibido un regalo!</h1>
		<p>${data.senderName} te ha regalado ${data.sessions} ${data.sessions === 1 ? 'sesion' : 'sesiones'} de fisioterapia</p>
	</div>
	<div class="content">
		<p>Hola ${data.recipientName},</p>
		<p>${data.senderName} te ha enviado un vale regalo de <strong>Laguntza Fisioterapia</strong>.</p>
		
		${data.message ? `<div class="message-box">"${data.message}"</div>` : ''}
		
		<div class="code-box">
			<p style="margin: 0 0 10px 0; color: #6b7280;">Tu codigo de vale regalo:</p>
			<div class="code">${data.code}</div>
		</div>
		
		<p><strong>Valor:</strong> ${data.sessions} ${data.sessions === 1 ? 'sesion' : 'sesiones'} (${data.amount} EUR)</p>
		<p><strong>Valido hasta:</strong> ${expiryDate}</p>
		
		<p>Para canjear tu vale, simplemente presenta este email o el PDF adjunto en nuestra clinica.</p>
		
		<div class="footer">
			<p>Laguntza Fisioterapia<br>Urnieta, Gipuzkoa</p>
		</div>
	</div>
</body>
</html>`;
	}

	// Email for sender (confirmation)
	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
		.content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
		.code-box { background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
		.code { font-family: monospace; font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 2px; }
		.footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
	</style>
</head>
<body>
	<div class="header">
		<h1>Gracias por tu compra!</h1>
		<p>Vale regalo para ${data.recipientName}</p>
	</div>
	<div class="content">
		<p>Hola ${data.senderName},</p>
		<p>Tu vale regalo ha sido generado correctamente. Adjuntamos el PDF que puedes imprimir o reenviar.</p>
		
		<div class="code-box">
			<p style="margin: 0 0 10px 0; color: #6b7280;">Codigo del vale:</p>
			<div class="code">${data.code}</div>
		</div>
		
		<p><strong>Para:</strong> ${data.recipientName}</p>
		<p><strong>Valor:</strong> ${data.sessions} ${data.sessions === 1 ? 'sesion' : 'sesiones'} (${data.amount} EUR)</p>
		<p><strong>Valido hasta:</strong> ${expiryDate}</p>
		
		<div class="footer">
			<p>Laguntza Fisioterapia<br>Urnieta, Gipuzkoa</p>
		</div>
	</div>
</body>
</html>`;
}

// Send email with PDF attachment
async function sendGiftCardEmail(data: {
	to: string;
	recipientName: string;
	senderName: string;
	sessions: number;
	amount: number;
	code: string;
	expiresAt: string;
	message?: string;
	isRecipient?: boolean;
}): Promise<void> {
	if (!import.meta.env.RESEND_API_KEY) {
		console.log('Resend not configured, skipping email to:', data.to);
		return;
	}

	try {
		// Read the PDF template
		const pdfPath = path.join(process.cwd(), 'src', 'assets', 'oparitxartelaA6.pdf');
		const pdfBuffer = await fs.readFile(pdfPath);
		const pdfBase64 = pdfBuffer.toString('base64');

		const subject = data.isRecipient 
			? `${data.senderName} te ha enviado un vale regalo!`
			: `Tu vale regalo para ${data.recipientName}`;

		const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

		await resend.emails.send({
			from: fromEmail,
			to: data.to,
			subject,
			html: getEmailHtml(data),
			attachments: [
				{
					filename: `vale-regalo-${data.code}.pdf`,
					content: pdfBase64,
				}
			],
		});

		console.log('Email sent to:', data.to);
	} catch (err) {
		console.error('Error sending email:', err);
		// Don't throw - email failure shouldn't block the purchase
	}
}

// ============================================
// ACTIONS
// ============================================

export const server = {
	// Create Stripe Payment Intent
	createPayment: defineAction({
		input: z.object({
			amount: z.number().min(1),
			sessions: z.number().min(1),
		}),
		handler: async ({ amount, sessions }) => {
			if (!import.meta.env.STRIPE_SECRET_KEY) {
				throw new ActionError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Stripe not configured',
				});
			}

			const paymentIntent = await stripe.paymentIntents.create({
				amount: amount * 100, // Stripe uses cents
				currency: 'eur',
				metadata: {
					type: 'gift_card',
					sessions: sessions.toString(),
				},
			});

			return {
				clientSecret: paymentIntent.client_secret,
				paymentIntentId: paymentIntent.id,
			};
		},
	}),

	// Generate gift card after successful payment
	generateGiftCard: defineAction({
		input: z.object({
			paymentIntentId: z.string(),
			sessions: z.number().min(1),
			amount: z.number().min(1),
			recipientName: z.string().min(1),
			recipientEmail: z.string().email().optional(),
			senderName: z.string().min(1),
			senderEmail: z.string().email(),
			message: z.string().optional(),
		}),
		handler: async (input) => {
			// Verify payment with Stripe (in production)
			if (import.meta.env.STRIPE_SECRET_KEY && import.meta.env.PROD) {
				try {
					const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
					if (paymentIntent.status !== 'succeeded') {
						throw new ActionError({
							code: 'BAD_REQUEST',
							message: 'Payment not completed',
						});
					}
				} catch (err) {
					throw new ActionError({
						code: 'BAD_REQUEST',
						message: 'Could not verify payment',
					});
				}
			}

			// Generate unique code
			const code = generateCode();
			const createdAt = new Date().toISOString();
			const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
			const securityHash = generateHash(code, input.amount, createdAt);

			// Create record
			const record: GiftCardRecord = {
				code,
				sessions: input.sessions,
				amount: input.amount,
				recipientName: input.recipientName,
				recipientEmail: input.recipientEmail || '',
				senderName: input.senderName,
				senderEmail: input.senderEmail,
				message: input.message || '',
				paymentIntentId: input.paymentIntentId,
				securityHash,
				createdAt,
				expiresAt,
				used: false,
				usedAt: null,
			};

			// Save to storage
			const cards = await loadGiftCards();
			cards[code] = record;
			await saveGiftCards(cards);

			// Generate verification URL with secret token (only for admin/clinic)
			const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
			const verifySecret = import.meta.env.VERIFY_SECRET || 'laguntza-verify-2024';
			const verificationUrl = `${siteUrl}/verify/${code}?token=${verifySecret}`;
			
			// Generate QR code URL
			const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;

			// Send email to sender (with PDF)
			await sendGiftCardEmail({
				to: input.senderEmail,
				recipientName: input.recipientName,
				senderName: input.senderName,
				sessions: input.sessions,
				amount: input.amount,
				code,
				expiresAt,
				message: input.message,
				isRecipient: false,
			});

			// Send email to recipient if email provided
			if (input.recipientEmail) {
				await sendGiftCardEmail({
					to: input.recipientEmail,
					recipientName: input.recipientName,
					senderName: input.senderName,
					sessions: input.sessions,
					amount: input.amount,
					code,
					expiresAt,
					message: input.message,
					isRecipient: true,
				});
			}

			return {
				code,
				securityHash,
				expiresAt,
				verificationUrl,
				qrUrl,
			};
		},
	}),

	// Verify a gift card code
	verifyCode: defineAction({
		input: z.object({
			code: z.string().min(1),
		}),
		handler: async ({ code }) => {
			const normalizedCode = code.toUpperCase().trim();
			const cards = await loadGiftCards();
			const card = cards[normalizedCode];

			if (!card) {
				return {
					valid: false,
					message: 'Codigo no encontrado',
				};
			}

			const isExpired = new Date(card.expiresAt) < new Date();
			
			if (isExpired) {
				return {
					valid: false,
					message: 'Vale caducado',
					code: card.code,
					expiresAt: card.expiresAt,
				};
			}

			if (card.used) {
				return {
					valid: false,
					message: 'Vale ya utilizado',
					code: card.code,
					usedAt: card.usedAt,
				};
			}

			return {
				valid: true,
				message: 'Vale valido',
				code: card.code,
				sessions: card.sessions,
				amount: card.amount,
				recipientName: card.recipientName,
				expiresAt: card.expiresAt,
			};
		},
	}),

	// Mark gift card as used (for clinic staff)
	markUsed: defineAction({
		input: z.object({
			code: z.string().min(1),
		}),
		handler: async ({ code }) => {
			const normalizedCode = code.toUpperCase().trim();
			const cards = await loadGiftCards();
			const card = cards[normalizedCode];

			if (!card) {
				throw new ActionError({
					code: 'NOT_FOUND',
					message: 'Codigo no encontrado',
				});
			}

			if (card.used) {
				throw new ActionError({
					code: 'BAD_REQUEST',
					message: 'Vale ya utilizado',
				});
			}

			card.used = true;
			card.usedAt = new Date().toISOString();
			await saveGiftCards(cards);

			return { success: true, code: card.code };
		},
	}),
};
