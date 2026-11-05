import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLegacyContact } from '../src/server/legacy-contact.ts';

const fixture = {
	templateName: 'laguntza-fisioterapia',
	to: 'visitor@example.com',
	lang: 'es',
	data: {
		name: 'Visitor',
		email: 'visitor@example.com',
		phone: '',
		message: 'Old website request',
		attachments: []
	}
};
test('accepts the existing Netlify form and keeps retry identifiers stable', async () => {
	const first = await parseLegacyContact(fixture);
	assert.equal(first.email, fixture.data.email);
	assert.equal(first.requestId, (await parseLegacyContact(fixture)).requestId);
	assert.notEqual(
		first.requestId,
		(
			await parseLegacyContact({
				...fixture,
				data: { ...fixture.data, message: 'Different' }
			})
		).requestId
	);
});
test('rejects injected sender, multiple/mismatched recipients and extra template variables', async () => {
	for (const input of [
		{ ...fixture, from: 'attacker@example.com' },
		{ ...fixture, to: ['visitor@example.com', 'other@example.com'] },
		{ ...fixture, to: 'other@example.com' },
		{ ...fixture, data: { ...fixture.data, html: '<img>' } }
	])
		await assert.rejects(parseLegacyContact(input));
});
test('decodes and validates existing attachment payloads while rejecting renamed binaries', async () => {
	const content = Buffer.from('%PDF-1.7\nfixture');
	const file = {
		filename: 'report.pdf',
		content: content.toString('base64'),
		contentType: 'application/pdf',
		size: content.length
	};
	const withFile = attachment => ({
		...fixture,
		data: { ...fixture.data, attachments: [attachment] }
	});
	const parsed = await parseLegacyContact(withFile(file));
	assert.equal(parsed.attachments[0].size, content.length);
	await assert.rejects(
		parseLegacyContact(
			withFile({
				...file,
				content: Buffer.from('MZ executable').toString('base64'),
				size: undefined
			})
		)
	);
	await assert.rejects(parseLegacyContact(withFile({ ...file, size: 1 })));
	await assert.rejects(
		parseLegacyContact(withFile({ ...file, content: '**invalid**' }))
	);
});
