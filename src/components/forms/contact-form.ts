import { actions } from 'astro:actions';
import {
	isAllowedAttachment,
	maxAttachments,
	maxTotalAttachmentSize
} from '@lib/contact';

class LaguntzaContact extends HTMLElement {
	private lifecycle?: AbortController;
	private submission?: { fingerprint: string; id: string };
	connectedCallback() {
		this.lifecycle?.abort();
		this.lifecycle = new AbortController();
		const form = this.querySelector('form');
		const button = this.querySelector<HTMLButtonElement>('button[type=submit]');
		const label = this.querySelector<HTMLElement>('[data-submit-label]');
		const status = this.querySelector<HTMLElement>('.form-status');
		if (!form || !button || !label || !status) return;
		const eu = this.dataset.lang === 'eu';
		const originalLabel = label.textContent;
		const showStatus = (message: string, error = false) => {
			status.textContent = message;
			status.hidden = false;
			status.toggleAttribute('data-error', error);
			status.focus();
		};
		form.addEventListener(
			'submit',
			async event => {
				event.preventDefault();
				if (button.disabled || !form.reportValidity()) return;
				const data = new FormData(form);
				const files = data
					.getAll('attachments')
					.filter(
						(value): value is File => value instanceof File && value.size > 0
					);
				if (
					files.length > maxAttachments ||
					files.reduce((total, file) => total + file.size, 0) >
						maxTotalAttachmentSize ||
					files.some(file => !isAllowedAttachment(file))
				) {
					showStatus(
						eu
							? 'Erantsi gehienez 3 JPG, PNG, PDF, DOC edo TXT fitxategi: 10 MiB gehienez bakoitzeko eta 15 MiB guztira. Egiaztatu fitxategien formatua ere.'
							: 'Adjunta hasta 3 archivos JPG, PNG, PDF, DOC o TXT: 10 MiB por archivo y 15 MiB en total. Comprueba también el formato de los archivos.',
						true
					);
					return;
				}
				data.delete('attachments');
				files.forEach(file => data.append('attachments', file));
				const fingerprint = JSON.stringify([
					data.get('name'),
					data.get('email'),
					data.get('phone'),
					data.get('message'),
					data.get('lang'),
					files.map(file => [file.name, file.size, file.lastModified])
				]);
				if (this.submission?.fingerprint !== fingerprint) {
					this.submission = { fingerprint, id: crypto.randomUUID() };
				}
				data.set('requestId', this.submission.id);
				status.hidden = true;
				button.disabled = true;
				button.setAttribute('aria-busy', 'true');
				label.textContent = eu ? 'Bidaltzen…' : 'Enviando…';
				let timeout: ReturnType<typeof setTimeout> | undefined;
				try {
					const result = await Promise.race([
						actions.contact(data),
						new Promise<never>((_, reject) => {
							timeout = setTimeout(() => reject(new Error('timeout')), 20000);
						})
					]);
					if (!this.isConnected) return;
					if (result.error)
						throw new Error(
							result.error.code === 'TOO_MANY_REQUESTS'
								? 'rate-limit'
								: 'server'
						);
					if (result.data.delivered) {
						form.reset();
						this.submission = undefined;
						showStatus(
							eu
								? 'Eskerrik asko. Zure mezua bidali da; lehenbailehen jarriko naiz zurekin harremanetan.'
								: 'Gracias. Tu mensaje se ha enviado; me pondré en contacto contigo lo antes posible.'
						);
					} else {
						showStatus(
							eu
								? 'Formularioa baliozkotu da. Proba-ingurune honetan ez da emailik bidaltzen.'
								: 'Formulario validado. En este entorno de prueba no se envían correos.'
						);
					}
				} catch (error) {
					if (!this.isConnected) return;
					showStatus(
						error instanceof Error && error.message === 'rate-limit'
							? eu
								? 'Eskaera gehiegi. Saiatu berriro minutu batzuk barru.'
								: 'Has enviado varias solicitudes. Inténtalo de nuevo en unos minutos.'
							: eu
								? 'Ezin izan da bidalketa baieztatu. Zure testua mantendu dugu; saiatu berriro edo idatzi WhatsApp bidez.'
								: 'No se ha podido confirmar el envío. Tu texto sigue aquí; vuelve a intentarlo o escríbeme por WhatsApp.',
						true
					);
				} finally {
					clearTimeout(timeout);
					button.disabled = false;
					button.removeAttribute('aria-busy');
					label.textContent = originalLabel;
				}
			},
			{ signal: this.lifecycle.signal }
		);
	}
	disconnectedCallback() {
		this.lifecycle?.abort();
	}
}
if (!customElements.get('laguntza-contact'))
	customElements.define('laguntza-contact', LaguntzaContact);
