import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

const base = 'http://127.0.0.1:4399';
let server;
let logs = '';
before(async () => {
	const runtimeEnv = {
		...process.env,
		NODE_ENV: 'production',
		HOST: '127.0.0.1',
		PORT: '4399',
		EMAIL_ENABLED: 'false',
		RESEND_API_KEY: '',
		FROM_EMAIL: '',
		COMPANY_EMAIL: ''
	};
	delete runtimeEnv.NODE_TEST_CONTEXT;
	server = spawn(process.execPath, ['dist/server/entry.mjs'], {
		env: runtimeEnv,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	server.stdout.on('data', data => {
		logs += data;
	});
	server.stderr.on('data', data => {
		logs += data;
	});
	for (let attempt = 0; attempt < 100; attempt++) {
		if (server.exitCode !== null) throw new Error(logs);
		try {
			const response = await fetch(`${base}/health/`, {
				signal: AbortSignal.timeout(1000),
				headers: { Connection: 'close' }
			});
			const body = await response.text();
			if (response.status !== 200 || !body.startsWith('{')) {
				throw new Error(
					`Health returned ${response.status} at ${response.url}: ${body.slice(0, 200)}`
				);
			}
			assert.equal(JSON.parse(body).emailEnabled, false);
			return;
		} catch (error) {
			if (attempt === 99) logs += String(error);
			await delay(100);
		}
	}
	throw new Error(`Runtime did not start: ${logs}`);
});
after(async () => {
	if (!server || server.exitCode !== null) return;
	server.kill('SIGTERM');
	await once(server, 'exit');
});

test('the root negotiates language, respects the manual cookie and preserves query parameters', async () => {
	for (const [headers, expected] of [
		[{ 'Accept-Language': 'eu-ES,es;q=0.8' }, 'eu'],
		[{ 'Accept-Language': 'eu', Cookie: 'laguntza-language=es' }, 'es'],
		[{ 'Accept-Language': 'es', Cookie: 'laguntza-language=eu' }, 'eu'],
		[{ 'Accept-Language': 'en-US' }, 'es']
	]) {
		const response = await fetch(`${base}/?utm_source=check`, {
			redirect: 'manual',
			headers
		});
		assert.equal(response.status, 302);
		assert.equal(
			response.headers.get('location'),
			`/${expected}/?utm_source=check`
		);
		assert.match(response.headers.get('cache-control'), /private.*no-store/);
		assert.match(response.headers.get('vary'), /Cookie/);
		assert.match(response.headers.get('vary'), /Accept-Language/);
	}
});
test('localized URLs keep their language regardless of cookies and browser preferences', async () => {
	const response = await fetch(`${base}/eu/services/`, {
		redirect: 'manual',
		headers: { 'Accept-Language': 'es', Cookie: 'laguntza-language=es' }
	});
	assert.equal(response.status, 200);
	assert.match(await response.text(), /<html[^>]+lang="eu"/);
});
test('the action validates a form while delivery is disabled without requiring API credentials', async () => {
	const form = makeForm();
	form.set('EMAIL_ENABLED', 'true');
	form.append(
		'attachments',
		new File(['%PDF-1.7\npreview'], 'sample.pdf', { type: 'application/pdf' })
	);
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: base },
		body: form
	});
	assert.equal(response.status, 200);
	const result = await response.text();
	assert.match(result, /delivered/);
	assert.match(result, /false|-1/);
});
test('the action rejects malformed submissions, invalid attachments and the honeypot', async () => {
	for (const changes of [{ email: 'bad' }, { name: '' }, { website: 'spam' }]) {
		const form = makeForm();
		for (const [key, value] of Object.entries(changes)) form.set(key, value);
		const response = await fetch(`${base}/_actions/contact/`, {
			method: 'POST',
			headers: { Origin: base },
			body: form
		});
		assert.equal(response.status, 400);
	}
	const form = makeForm();
	form.append('attachments', new File(['test'], 'bad.exe'));
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: base },
		body: form
	});
	assert.equal(response.status, 400);
});
test('accepts a 6 MiB attachment above the previous file and Astro body limits', async () => {
	const form = makeForm();
	form.append(
		'attachments',
		new File(['%PDF-1.7\n', new Uint8Array(6 * 1024 * 1024)], 'large.pdf', {
			type: 'application/pdf'
		})
	);
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: base },
		body: form
	});
	assert.equal(response.status, 200);
});
test('rejects executable content disguised as an allowed attachment', async () => {
	const form = makeForm();
	form.append(
		'attachments',
		new File(['MZ fake executable'], 'invoice.pdf', { type: 'application/pdf' })
	);
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: base },
		body: form
	});
	assert.equal(response.status, 400);
});
test('rejects request bodies exceeding the configured 16 MiB limit', async () => {
	const form = makeForm();
	form.append(
		'attachments',
		new File([new Uint8Array(16 * 1024 * 1024)], 'oversized.pdf', {
			type: 'application/pdf'
		})
	);
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: base },
		body: form
	});
	assert.equal(response.status, 413);
});
test('the action rejects cross-origin form submissions', async () => {
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: { Origin: 'https://other.example' },
		body: makeForm()
	});
	assert.equal(response.status, 403);
});
test('accepts the validated HTTPS origin forwarded by Nginx', async () => {
	const response = await fetch(`${base}/_actions/contact/`, {
		method: 'POST',
		headers: {
			Host: 'test.laguntzafisioterapia.com',
			'X-Forwarded-Host': 'test.laguntzafisioterapia.com',
			'X-Forwarded-Proto': 'https',
			'X-Forwarded-For': '198.51.100.10',
			Origin: 'https://test.laguntzafisioterapia.com'
		},
		body: makeForm()
	});
	assert.equal(response.status, 200);
});
test('missing pages return the bilingual custom 404', async () => {
	const response = await fetch(`${base}/not-a-real-page/`);
	assert.equal(response.status, 404);
	assert.match(await response.text(), /missing-page/);
});

function makeForm() {
	const form = new FormData();
	for (const [key, value] of Object.entries({
		requestId: crypto.randomUUID(),
		lang: 'es',
		name: 'Runtime test',
		email: 'visitor@example.com',
		message: 'Prueba sin envío',
		website: ''
	}))
		form.set(key, value);
	return form;
}
