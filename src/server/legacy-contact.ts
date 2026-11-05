import { createHash } from 'node:crypto';
import { z } from 'astro/zod';
import { contactSchema } from './contact-schema.ts';
import {
	maxAttachments,
	maxAttachmentSize,
	maxTotalAttachmentSize
} from '../lib/contact.ts';

const attachment = z
	.object({
		filename: z.string().max(180),
		content: z
			.string()
			.min(4)
			.max(Math.ceil(maxAttachmentSize / 3) * 4)
			.regex(
				/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
			),
		contentType: z.string().max(120).optional(),
		size: z.number().int().min(1).max(maxAttachmentSize).optional()
	})
	.strict();
const legacySchema = z
	.object({
		templateName: z.literal('laguntza-fisioterapia'),
		to: z.email().max(254),
		lang: z.enum(['es', 'eu']),
		data: z
			.object({
				name: z.string().max(120),
				email: z.email().max(254),
				phone: z.string().max(32).optional(),
				message: z.string().max(6000),
				attachments: z.array(attachment).max(maxAttachments).default([])
			})
			.strict()
	})
	.strict()
	.refine(value => value.to === value.data.email);

export async function parseLegacyContact(body: unknown) {
	const envelope = legacySchema.parse(body);
	const files = envelope.data.attachments.map(item => {
		const content = Buffer.from(item.content, 'base64');
		if (
			content.length > maxAttachmentSize ||
			(item.size !== undefined && item.size !== content.length)
		)
			throw new Error('Invalid attachment size');
		return new File([content], item.filename, { type: item.contentType || '' });
	});
	if (files.reduce((sum, file) => sum + file.size, 0) > maxTotalAttachmentSize)
		throw new Error('Invalid total attachment size');
	// Old clients have no UUID. Identical retries use the same provider key.
	const hash = createHash('sha256')
		.update(JSON.stringify(envelope))
		.digest('hex');
	const requestId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
	return contactSchema.parseAsync({
		...envelope.data,
		attachments: files,
		lang: envelope.lang,
		requestId,
		website: ''
	});
}
