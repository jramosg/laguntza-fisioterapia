import { z } from 'astro/zod';
import { isAllowedAttachment, maxAttachments } from '../lib/contact.ts';

export const contactSchema = z.object({
	requestId: z.uuid(),
	lang: z.enum(['es', 'eu']),
	name: z.string().trim().min(1).max(120),
	email: z.email().max(254),
	phone: z
		.string()
		.trim()
		.max(32)
		.nullish()
		.transform(value => value || ''),
	message: z.string().trim().min(1).max(6000),
	website: z
		.string()
		.max(200)
		.nullish()
		.transform(value => value || ''),
	attachments: z
		.array(z.instanceof(File).refine(isAllowedAttachment, 'Invalid attachment'))
		.max(maxAttachments)
		.default([])
});

export type ContactInput = z.infer<typeof contactSchema>;
