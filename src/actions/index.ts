import { defineAction, ActionError } from 'astro:actions';
import { contactSchema } from '../server/contact-schema.ts';
import {
	submitContact,
	ContactSubmissionError
} from '../server/contact-delivery.ts';

export const server = {
	contact: defineAction({
		accept: 'form',
		input: contactSchema,
		handler: async (input, context) => {
			try {
				return await submitContact(input, context.clientAddress);
			} catch (error) {
				const status =
					error instanceof ContactSubmissionError ? error.status : 500;
				const codes = {
					400: 'BAD_REQUEST',
					429: 'TOO_MANY_REQUESTS',
					503: 'SERVICE_UNAVAILABLE',
					500: 'INTERNAL_SERVER_ERROR'
				} as const;
				throw new ActionError({ code: codes[status] });
			}
		}
	})
};
