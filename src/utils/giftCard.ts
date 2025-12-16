import * as crypto from 'crypto';

// Types
export interface GiftCardData {
	code: string;
	amount: number;
	sessions: number;
	recipientName: string;
	recipientEmail: string;
	senderName: string;
	senderEmail: string;
	giftMessage: string;
	paymentIntentId: string;
	createdAt: string;
	expiryDate: string;
	used: boolean;
	usedAt: string | null;
}

export interface EmailData {
	to: string;
	recipientName: string;
	senderName: string;
	amount: number;
	code: string;
	expiryDate: string;
	pdfBuffer: Buffer;
	isRecipient?: boolean;
	giftMessage?: string;
}

// In-memory storage for development (replace with database in production)
const giftCardStorage: Map<string, GiftCardData> = new Map();

/**
 * Generate a unique gift card code with cryptographic security
 * Format: LF-XXXX-XXXX (where X is alphanumeric)
 */
export function generateGiftCardCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars (0, O, 1, I)
	const randomBytes = crypto.randomBytes(8);
	
	let code = 'LF-';
	for (let i = 0; i < 8; i++) {
		if (i === 4) code += '-';
		code += chars[randomBytes[i] % chars.length];
	}
	
	return code;
}

/**
 * Generate a secure hash for verification
 * This hash is embedded in the PDF as an anti-counterfeiting measure
 */
export function generateSecurityHash(data: GiftCardData): string {
	const secret = import.meta.env.GIFT_CARD_SECRET || 'laguntza-fisioterapia-secret-key';
	const payload = `${data.code}:${data.amount}:${data.createdAt}:${data.paymentIntentId}`;
	
	return crypto
		.createHmac('sha256', secret)
		.update(payload)
		.digest('hex')
		.substring(0, 12)
		.toUpperCase();
}

/**
 * Verify a gift card's authenticity
 */
export function verifySecurityHash(data: GiftCardData, hash: string): boolean {
	const expectedHash = generateSecurityHash(data);
	const expectedBuffer = new Uint8Array(Buffer.from(expectedHash));
	const hashBuffer = new Uint8Array(Buffer.from(hash));
	if (expectedBuffer.length !== hashBuffer.length) return false;
	return crypto.timingSafeEqual(expectedBuffer, hashBuffer);
}

/**
 * Save gift card to storage
 * In production, replace with database call (MongoDB, PostgreSQL, etc.)
 */
export async function saveGiftCard(data: GiftCardData): Promise<void> {
	// Add security hash to the data
	const securityHash = generateSecurityHash(data);
	const dataWithHash = { ...data, securityHash };
	
	// For production, save to database
	// await db.giftCards.create(dataWithHash);
	
	// For development, use in-memory storage
	giftCardStorage.set(data.code, dataWithHash as GiftCardData);
	
	// Also save to a JSON file for persistence (simple file-based storage)
	// In production, use a proper database
	try {
		const fs = await import('fs/promises');
		const path = await import('path');
		const storageDir = path.join(process.cwd(), 'data');
		const storagePath = path.join(storageDir, 'gift-cards.json');
		
		// Create directory if it doesn't exist
		await fs.mkdir(storageDir, { recursive: true });
		
		// Read existing data
		let existingData: Record<string, GiftCardData> = {};
		try {
			const fileContent = await fs.readFile(storagePath, 'utf-8');
			existingData = JSON.parse(fileContent);
		} catch {
			// File doesn't exist yet
		}
		
		// Add new card
		existingData[data.code] = dataWithHash as GiftCardData;
		
		// Save
		await fs.writeFile(storagePath, JSON.stringify(existingData, null, 2));
	} catch (err) {
		console.error('Error saving gift card to file:', err);
	}
}

/**
 * Verify a gift card code and retrieve its data
 */
export async function verifyGiftCard(code: string): Promise<GiftCardData | null> {
	// Check in-memory first
	if (giftCardStorage.has(code)) {
		return giftCardStorage.get(code)!;
	}
	
	// Check file storage
	try {
		const fs = await import('fs/promises');
		const path = await import('path');
		const storagePath = path.join(process.cwd(), 'data', 'gift-cards.json');
		
		const fileContent = await fs.readFile(storagePath, 'utf-8');
		const data: Record<string, GiftCardData> = JSON.parse(fileContent);
		
		if (data[code]) {
			// Add to in-memory cache
			giftCardStorage.set(code, data[code]);
			return data[code];
		}
	} catch {
		// File doesn't exist
	}
	
	return null;
}

/**
 * Mark a gift card as used
 */
export async function markGiftCardAsUsed(code: string): Promise<boolean> {
	const giftCard = await verifyGiftCard(code);
	if (!giftCard || giftCard.used) {
		return false;
	}
	
	giftCard.used = true;
	giftCard.usedAt = new Date().toISOString();
	
	// Update storage
	giftCardStorage.set(code, giftCard);
	
	// Update file storage
	try {
		const fs = await import('fs/promises');
		const path = await import('path');
		const storagePath = path.join(process.cwd(), 'data', 'gift-cards.json');
		
		const fileContent = await fs.readFile(storagePath, 'utf-8');
		const data: Record<string, GiftCardData> = JSON.parse(fileContent);
		
		data[code] = giftCard;
		await fs.writeFile(storagePath, JSON.stringify(data, null, 2));
	} catch (err) {
		console.error('Error updating gift card:', err);
	}
	
	return true;
}

/**
 * Generate a PDF gift card
 * Uses a simple approach - for production, consider using pdf-lib or puppeteer
 */
export async function generateGiftCardPDF(data: GiftCardData): Promise<Buffer> {
	// For a simple implementation, we'll generate an HTML template and convert to PDF
	// In production, you might want to use a library like pdf-lib or puppeteer
	
	const securityHash = generateSecurityHash(data);
	
	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		@page { size: A6 landscape; margin: 0; }
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Helvetica Neue', Arial, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.card {
			width: 100%;
			max-width: 500px;
			background: white;
			border-radius: 16px;
			overflow: hidden;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		}
		.header {
			background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%);
			color: white;
			padding: 24px;
			text-align: center;
		}
		.logo {
			font-size: 24px;
			font-weight: bold;
			margin-bottom: 8px;
		}
		.subtitle {
			font-size: 14px;
			opacity: 0.9;
		}
		.content {
			padding: 32px 24px;
			text-align: center;
		}
		.gift-title {
			font-size: 18px;
			color: #666;
			margin-bottom: 8px;
		}
		.amount {
			font-size: 48px;
			font-weight: bold;
			color: #2d5016;
			margin-bottom: 16px;
		}
		.recipient {
			font-size: 16px;
			color: #333;
			margin-bottom: 24px;
		}
		.code-section {
			background: #f5f5f5;
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 16px;
		}
		.code-label {
			font-size: 12px;
			color: #666;
			text-transform: uppercase;
			margin-bottom: 8px;
		}
		.code {
			font-family: 'Courier New', monospace;
			font-size: 24px;
			font-weight: bold;
			color: #2d5016;
			letter-spacing: 2px;
		}
		.message {
			font-style: italic;
			color: #666;
			margin: 16px 0;
			padding: 16px;
			background: #fafafa;
			border-radius: 8px;
		}
		.footer {
			padding: 16px 24px;
			background: #f9f9f9;
			border-top: 1px solid #eee;
			font-size: 11px;
			color: #999;
		}
		.footer-row {
			display: flex;
			justify-content: space-between;
			margin-bottom: 4px;
		}
		.security {
			font-family: monospace;
			font-size: 10px;
			color: #ccc;
			margin-top: 8px;
		}
		.qr-placeholder {
			width: 80px;
			height: 80px;
			background: #eee;
			margin: 16px auto;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 10px;
			color: #999;
		}
	</style>
</head>
<body>
	<div class="card">
		<div class="header">
			<div class="logo">🌿 Laguntza Fisioterapia</div>
			<div class="subtitle">Vale Regalo / Opari Txartela</div>
		</div>
		<div class="content">
			<div class="gift-title">Este vale tiene un valor de</div>
			<div class="amount">${data.amount}€</div>
			<div class="recipient">
				Para: <strong>${data.recipientName}</strong><br>
				De: ${data.senderName}
			</div>
			${data.giftMessage ? `<div class="message">"${data.giftMessage}"</div>` : ''}
			<div class="code-section">
				<div class="code-label">Código del vale</div>
				<div class="code">${data.code}</div>
			</div>
		</div>
		<div class="footer">
			<div class="footer-row">
				<span>Válido hasta: ${formatDate(data.expiryDate)}</span>
				<span>Sesiones: ${data.sessions}</span>
			</div>
			<div class="footer-row">
				<span>Zubitxo Plaza, 3 - 20130 Urnieta</span>
				<span>Tel: 943 036 070</span>
			</div>
			<div class="security">ID: ${securityHash}</div>
		</div>
	</div>
</body>
</html>
	`;
	
	// Convert HTML to PDF
	// For production, use puppeteer or similar:
	// const browser = await puppeteer.launch();
	// const page = await browser.newPage();
	// await page.setContent(html);
	// const pdf = await page.pdf({ format: 'A6', landscape: true });
	// await browser.close();
	// return pdf;
	
	// For now, return the HTML as a simple PDF placeholder
	// In production, integrate with a PDF generation service
	return Buffer.from(html, 'utf-8');
}

/**
 * Send email with gift card
 */
export async function sendGiftCardEmail(emailData: EmailData): Promise<void> {
	// In production, integrate with an email service like:
	// - Resend
	// - SendGrid
	// - Postmark
	// - Nodemailer with SMTP
	
	const { to, recipientName, senderName, amount, code, expiryDate, pdfBuffer, isRecipient, giftMessage } = emailData;
	
	const subject = isRecipient 
		? `🎁 ${senderName} te ha enviado un Vale Regalo de Laguntza Fisioterapia`
		: `Tu Vale Regalo de Laguntza Fisioterapia - ${code}`;
	
	const bodyText = isRecipient 
		? `
¡Hola ${recipientName}!

${senderName} te ha enviado un Vale Regalo de Laguntza Fisioterapia por valor de ${amount}€.

${giftMessage ? `Mensaje: "${giftMessage}"` : ''}

Tu código de vale es: ${code}

Para canjearlo, simplemente preséntalo en nuestra clínica:
📍 Zubitxo Plaza, 3 - 20130 Urnieta
📞 943 036 070

Válido hasta: ${formatDate(expiryDate)}

¡Esperamos verte pronto!

Laguntza Fisioterapia
		`
		: `
¡Gracias por tu compra!

Has adquirido un Vale Regalo de Laguntza Fisioterapia por valor de ${amount}€ para ${recipientName}.

Código del vale: ${code}

Puedes descargar el vale en formato PDF adjunto a este email.

Detalles:
- Importe: ${amount}€
- Destinatario: ${recipientName}
- Válido hasta: ${formatDate(expiryDate)}

Si tienes alguna pregunta, no dudes en contactarnos:
📞 943 036 070
📧 info@laguntzafisioterapia.com

¡Gracias por confiar en nosotros!

Laguntza Fisioterapia
Zubitxo Plaza, 3 - 20130 Urnieta
		`;
	
	console.log('📧 Email would be sent to:', to);
	console.log('Subject:', subject);
	console.log('Body:', bodyText);
	
	// Example with Resend (production):
	// import { Resend } from 'resend';
	// const resend = new Resend(import.meta.env.RESEND_API_KEY);
	// await resend.emails.send({
	//   from: 'Laguntza Fisioterapia <noreply@laguntzafisioterapia.com>',
	//   to,
	//   subject,
	//   text: bodyText,
	//   attachments: [{
	//     filename: `vale-regalo-${code}.pdf`,
	//     content: pdfBuffer,
	//   }],
	// });
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}
