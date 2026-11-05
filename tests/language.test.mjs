import assert from 'node:assert/strict';
import test from 'node:test';
import { negotiateLanguage } from '../src/i18n/negotiation.ts';

test('a valid manual choice takes priority over browser preferences', () => {
	assert.equal(negotiateLanguage('es', 'eu,es;q=0.5'), 'es');
	assert.equal(negotiateLanguage('eu', 'es-ES,en;q=0.5'), 'eu');
});
test('selects the supported language with the greatest quality', () => {
	assert.equal(negotiateLanguage(undefined, 'en-US,es;q=0.7,eu;q=0.9'), 'eu');
	assert.equal(negotiateLanguage(undefined, 'eu;q=0.3,es-ES;q=0.8'), 'es');
});
test('accepts regional tags, case differences and equal-priority ordering', () => {
	assert.equal(negotiateLanguage(undefined, 'EU-ES,es'), 'eu');
	assert.equal(negotiateLanguage(undefined, 'es,eu'), 'es');
});
test('ignores invalid saved choices and excluded or malformed weights', () => {
	assert.equal(negotiateLanguage('/external', 'eu;q=0,es;q=1'), 'es');
	assert.equal(negotiateLanguage('invalid', 'es;q=no,eu;q=0.5'), 'eu');
	assert.equal(negotiateLanguage(undefined, 'es;q=2,eu;q=0.2'), 'eu');
});
test('defaults to Spanish for missing or unsupported browser languages', () => {
	for (const header of [null, '', 'en-US,fr;q=0.9', '*', 'eu;q=0,es;q=0']) {
		assert.equal(negotiateLanguage(undefined, header), 'es');
	}
});
