import { EMAIL_ENABLED, getSecret } from 'astro:env/server';
import { Resend } from 'resend';
import { processContact, ContactRateLimit } from './contact.ts';
import type { ContactInput } from './contact-schema.ts';

const limiter = new ContactRateLimit();

export class ContactSubmissionError extends Error {
	constructor(public status: 400 | 429 | 503 | 500) {
		super('Contact submission failed');
	}
}

export async function submitContact(input: ContactInput, address: string) {
	if (input.website) throw new ContactSubmissionError(400);
	if (EMAIL_ENABLED) {
		if (!limiter.allow(address)) throw new ContactSubmissionError(429);
		if (
			!getSecret('RESEND_API_KEY') ||
			!getSecret('FROM_EMAIL') ||
			!getSecret('COMPANY_EMAIL')
		)
			throw new ContactSubmissionError(503);
	}
	try {
		return await processContact(
			input,
			{
				enabled: EMAIL_ENABLED,
				from: getSecret('FROM_EMAIL'),
				companyEmail: getSecret('COMPANY_EMAIL'),
				bcc: getSecret('BCC_EMAIL')
			},
			(message, options) =>
				new Resend(getSecret('RESEND_API_KEY')).emails.send(message, options)
		);
	} catch {
		console.error('Contact email delivery failed');
		throw new ContactSubmissionError(500);
	}
}
