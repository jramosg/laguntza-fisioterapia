import { defineAction, ActionError } from 'astro:actions';
import { EMAIL_ENABLED, getSecret } from 'astro:env/server';
import { Resend } from 'resend';
import { contactSchema } from '../server/contact-schema.ts';
import { processContact, ContactRateLimit } from '../server/contact.ts';
import esHtml from '../server/templates/es.html?raw';
import esText from '../server/templates/es.txt?raw';
import euHtml from '../server/templates/eu.html?raw';
import euText from '../server/templates/eu.txt?raw';

const limiter = new ContactRateLimit();
const templates = {
	es: { html: esHtml, text: esText },
	eu: { html: euHtml, text: euText }
};

export const server = {
	contact: defineAction({
		accept: 'form',
		input: contactSchema,
		handler: async (input, context) => {
			if (input.website) throw new ActionError({ code: 'BAD_REQUEST' });
			if (EMAIL_ENABLED) {
				if (!limiter.allow(context.clientAddress))
					throw new ActionError({ code: 'TOO_MANY_REQUESTS' });
				if (
					!getSecret('RESEND_API_KEY') ||
					!getSecret('FROM_EMAIL') ||
					!getSecret('COMPANY_EMAIL')
				) {
					throw new ActionError({ code: 'SERVICE_UNAVAILABLE' });
				}
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
					templates,
					(message, options) =>
						new Resend(getSecret('RESEND_API_KEY')).emails.send(
							message,
							options
						)
				);
			} catch {
				console.error('Contact email delivery failed');
				throw new ActionError({ code: 'INTERNAL_SERVER_ERROR' });
			}
		}
	})
};
