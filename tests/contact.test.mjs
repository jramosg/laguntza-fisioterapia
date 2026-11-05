import assert from 'node:assert/strict';
import test from 'node:test';
import { contactSchema } from '../src/server/contact-schema.ts';
import { processContact, ContactRateLimit } from '../src/server/contact.ts';
import {
	renderContact,
	renderConfirmation
} from '../src/server/contact-emails.ts';
const fixture = {
	requestId: '9b324342-d56c-48d9-a01e-f96f0a089c69',
	lang: 'es',
	name: 'Prueba',
	email: 'visitor@example.com',
	phone: '+33 6 12 34 56 78',
	message: 'Consulta de prueba',
	website: '',
	attachments: []
};
const settings = {
	enabled: true,
	from: 'Laguntza <clinic@example.com>',
	companyEmail: 'clinic@example.com'
};

test('disabled delivery never invokes the provider, including without credentials', async () => {
	let calls = 0;
	const result = await processContact(fixture, { enabled: false }, async () => {
		calls++;
	});
	assert.equal(result.delivered, false);
	assert.equal(calls, 0);
});
test('validates and normalizes contact fields and ignores client-supplied mail routing', () => {
	const result = contactSchema.parse({
		...fixture,
		name: '  Prueba  ',
		phone: null,
		to: 'other@example.com',
		from: 'other@example.com'
	});
	assert.equal(result.name, 'Prueba');
	assert.equal(result.phone, '');
	assert.equal('to' in result, false);
	assert.equal('from' in result, false);
});
test('rejects malformed requests and excessive message length', () => {
	for (const values of [
		{ name: ' ' },
		{ email: 'bad' },
		{ lang: 'en' },
		{ requestId: 'bad' },
		{ message: 'x'.repeat(6001) }
	]) {
		assert.equal(
			contactSchema.safeParse({ ...fixture, ...values }).success,
			false
		);
	}
});
test('enforces attachment size, extension, filename and count on the server', async () => {
	const pdf = new File(['%PDF-1.7\nproof'], 'sample.pdf', {
		type: 'application/pdf'
	});
	assert.equal(
		(await contactSchema.safeParseAsync({ ...fixture, attachments: [pdf] }))
			.success,
		true
	);
	for (const files of [
		[pdf, pdf, pdf, pdf],
		[new File(['proof'], 'script.exe')],
		[new File(['proof'], '../sample.pdf')],
		[new File(['MZ executable'], 'renamed.pdf', { type: 'application/pdf' })],
		[new File(['%PDF-1.7\nproof'], 'wrong.pdf', { type: 'image/png' })],
		[new File(['plain\u0000text'], 'sample.txt', { type: 'text/plain' })],
		[new File(['proof'], 'sample\u202e.pdf')],
		[new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf')],
		[1, 2].map(
			n =>
				new File(
					['%PDF-1.7\n', new Uint8Array(8 * 1024 * 1024)],
					`large-${n}.pdf`,
					{ type: 'application/pdf' }
				)
		)
	])
		assert.equal(
			(await contactSchema.safeParseAsync({ ...fixture, attachments: files }))
				.success,
			false
		);
});
test('escapes visitor data in HTML while preserving literal content in plain text', () => {
	const input = {
		...fixture,
		name: '<img onerror="alert(1)">',
		message: '$& <script>alert(1)</script>'
	};
	const result = renderContact(input);
	assert.ok(!result.html.includes(input.name));
	assert.ok(!result.html.includes('<script>'));
	assert.ok(result.html.includes('&lt;script&gt;'));
	assert.ok(result.html.includes('$&amp;'));
	assert.ok(result.text.includes(input.message));
});
test('uses server-configured recipients, reply-to, BCC and an idempotency key', async () => {
	const messages = [];
	const result = await processContact(
		fixture,
		{ ...settings, bcc: 'archive@example.com' },
		async (message, options) => {
			messages.push({ message, options });
			return { data: { id: 'mock' }, error: null };
		}
	);
	assert.equal(result.delivered, true);
	const [sent, confirmation] = messages;
	assert.deepEqual(sent.message.to, ['clinic@example.com']);
	assert.equal(sent.message.replyTo, 'visitor@example.com');
	assert.deepEqual(sent.message.bcc, ['archive@example.com']);
	assert.equal(
		sent.options.idempotencyKey,
		`laguntza-contact:${fixture.requestId}`
	);
	assert.deepEqual(confirmation.message.to, ['visitor@example.com']);
	assert.equal(confirmation.message.attachments, undefined);
	assert.equal(confirmation.message.bcc, undefined);
	assert.ok(!confirmation.message.text.includes(fixture.message));
	assert.ok(!confirmation.message.text.includes(fixture.phone));
	for (const content of [
		confirmation.message.html,
		confirmation.message.text
	]) {
		assert.ok(!content.includes(fixture.name));
		assert.ok(!content.includes(fixture.email));
		assert.ok(!content.includes(fixture.message));
		assert.ok(!content.includes(fixture.phone));
	}
	assert.equal(
		confirmation.options.idempotencyKey,
		`laguntza-contact:${fixture.requestId}:confirmation`
	);
});
test('preserves Basque templates and attachment data', async () => {
	const messages = [];
	await processContact(
		{
			...fixture,
			lang: 'eu',
			attachments: [
				new File(['%PDF-1.7\nproof'], 'sample.pdf', { type: 'application/pdf' })
			]
		},
		settings,
		async message => {
			messages.push(message);
			return { data: { id: 'mock' }, error: null };
		}
	);
	const [sent, confirmation] = messages;
	assert.ok(sent.subject.startsWith('Kontsulta berria'));
	assert.ok(confirmation.subject.startsWith('Zure mezua'));
	assert.ok(confirmation.html.includes('Eskerrik asko<br />idazteagatik.'));
	assert.ok(confirmation.text.includes('Zure mezua Laguntzara iritsi da.'));
	assert.ok(!confirmation.html.includes('sample.pdf'));
	assert.equal(
		sent.attachments[0].content,
		Buffer.from('%PDF-1.7\nproof').toString('base64')
	);
	assert.ok(sent.html.includes('sample.pdf'));
});
test('does not report delivery success when configuration or provider fails', async () => {
	await assert.rejects(
		processContact(fixture, { enabled: true }, async () => {})
	);
	await assert.rejects(
		processContact(fixture, settings, async () => ({
			data: null,
			error: { message: 'rejected' }
		}))
	);
});
test('renders both locales, multiline messages and literal placeholder-like input', () => {
	for (const lang of ['eu', 'es']) {
		const input = {
			...fixture,
			lang,
			message: 'Primera línea\n{{name}} & segunda'
		};
		const clinic = renderContact(input);
		const confirmation = renderConfirmation(lang);
		assert.ok(clinic.html.includes(`<html lang="${lang}"`));
		assert.ok(confirmation.html.includes(`<html lang="${lang}"`));
		assert.ok(
			clinic.html.includes('Primera línea<br />{{name}} &amp; segunda')
		);
		assert.ok(clinic.text.includes(input.message));
		assert.ok(
			confirmation.html.includes(
				lang === 'eu' ? 'Eskerrik asko' : 'Gracias por'
			)
		);
		assert.ok(!confirmation.html.includes(input.message));
		assert.ok(Buffer.byteLength(confirmation.html) < 30 * 1024);
	}
});
test('rate limits per IP, with separate minute and hour budgets', () => {
	const limit = new ContactRateLimit();
	assert.equal(limit.allow('one', 0), true);
	assert.equal(limit.allow('one', 1), true);
	assert.equal(limit.allow('one', 2), false);
	assert.equal(limit.allow('two', 2), true);
	assert.equal(limit.allow('one', 60001), true);
	assert.equal(limit.allow('one', 60002), true);
	assert.equal(limit.allow('one', 120003), true);
	assert.equal(limit.allow('one', 180004), false);
	assert.equal(limit.allow('one', 3600002), true);
});
