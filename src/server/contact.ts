import type { CreateEmailOptions } from 'resend';
import type { ContactInput } from './contact-schema.ts';
import { attachmentContentType } from './attachments.ts';

export type EmailTemplate = { html: string; text: string };
export type Templates = Record<'es' | 'eu', EmailTemplate>;
export type EmailSettings = {
	enabled: boolean;
	from?: string;
	companyEmail?: string;
	bcc?: string;
};
export type SendEmail = (
	message: CreateEmailOptions,
	options: { idempotencyKey: string }
) => Promise<{ data: { id: string } | null; error: unknown }>;

function escapeHtml(value: string) {
	return value.replace(
		/[&<>"']/g,
		char =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[char]!
	);
}

export function renderContact(input: ContactInput, template: EmailTemplate) {
	const values: Record<string, string> = {
		name: input.name,
		email: input.email,
		phone: input.phone,
		message: input.message,
		attachmentNames: input.attachments.map(file => file.name).join(', '),
		year: String(new Date().getFullYear())
	};
	const replace = (text: string, html: boolean) =>
		text.replace(
			/\{\{(name|email|phone|message|attachmentNames|year)\}\}/g,
			(_, key: string) => (html ? escapeHtml(values[key]) : values[key])
		);
	return {
		html: replace(template.html, true),
		text: replace(template.text, false)
	};
}

export async function processContact(
	input: ContactInput,
	settings: EmailSettings,
	templates: Templates,
	send: SendEmail
) {
	if (!settings.enabled) return { delivered: false };
	if (!settings.from || !settings.companyEmail)
		throw new Error('mail-not-configured');
	const rendered = renderContact(input, templates[input.lang]);
	const company = settings.companyEmail
		.split(',')
		.map(email => email.trim())
		.filter(Boolean);
	if (!company.length) throw new Error('mail-not-configured');
	const bcc = settings.bcc
		?.split(',')
		.map(email => email.trim())
		.filter(Boolean);
	const message: CreateEmailOptions = {
		from: settings.from,
		to: [...new Set(company)],
		replyTo: input.email,
		subject:
			input.lang === 'eu'
				? 'Zure mezua jaso dugu - Laguntza Fisioterapia'
				: 'Hemos recibido tu mensaje - Laguntza Fisioterapia',
		...rendered,
		...(bcc?.length ? { bcc } : {}),
		attachments: await Promise.all(
			input.attachments.map(async file => ({
				filename: file.name,
				content: Buffer.from(await file.arrayBuffer()).toString('base64'),
				contentType: (await attachmentContentType(file))!
			}))
		)
	};
	const result = await send(message, {
		idempotencyKey: `laguntza-contact:${input.requestId}`
	});
	if (result.error || !result.data?.id) throw new Error('mail-delivery-failed');
	// A mistyped, unverified address must never receive clinical content/files.
	try {
		const text =
			input.lang === 'eu'
				? 'Zure mezua jaso dugu. Laguntza Fisioterapia zurekin harremanetan jarriko da lehenbailehen.'
				: 'Hemos recibido tu mensaje. Laguntza Fisioterapia se pondrá en contacto contigo lo antes posible.';
		const confirmation = await send(
			{
				from: settings.from,
				to: [input.email],
				replyTo: 'info@laguntzafisioterapia.com',
				subject:
					input.lang === 'eu'
						? 'Zure mezua jaso dugu - Laguntza Fisioterapia'
						: 'Hemos recibido tu mensaje - Laguntza Fisioterapia',
				text,
				html: `<p>${text}</p>`
			},
			{ idempotencyKey: `laguntza-contact:${input.requestId}:confirmation` }
		);
		if (confirmation.error || !confirmation.data?.id)
			console.error('Contact confirmation delivery failed');
	} catch {
		// The clinic already received the request; do not encourage duplicate sends.
		console.error('Contact confirmation delivery failed');
	}
	return { delivered: true };
}

export class ContactRateLimit {
	private attempts = new Map<string, number[]>();
	allow(ip: string, now = Date.now()) {
		const hour = 60 * 60 * 1000;
		for (const [key, times] of this.attempts) {
			if (times[times.length - 1] <= now - hour) this.attempts.delete(key);
		}
		const times = (this.attempts.get(ip) || []).filter(
			time => time > now - hour
		);
		if (
			times.length >= 5 ||
			times.filter(time => time > now - 60000).length >= 2
		)
			return false;
		if (!this.attempts.has(ip) && this.attempts.size >= 10000) return false;
		this.attempts.set(ip, [...times, now]);
		return true;
	}
}
