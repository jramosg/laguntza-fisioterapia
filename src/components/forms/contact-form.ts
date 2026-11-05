import { actions } from 'astro:actions';
import {
	isAllowedAttachment,
	maxAttachments,
	maxAttachmentSize,
	maxTotalAttachmentSize
} from '@lib/contact';

class LaguntzaContact extends HTMLElement {
	private lifecycle?: AbortController;
	private submission?: { fingerprint: string; id: string };
	private selectedFiles: File[] = [];
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
		const signal = this.lifecycle.signal;
		const attachments = this.querySelector<HTMLElement>('.attachment-options');
		const picker = this.querySelector<HTMLButtonElement>(
			'[data-attachment-picker]'
		);
		const input = this.querySelector<HTMLInputElement>('input[type=file]');
		const list = this.querySelector<HTMLUListElement>('.attachment-list');
		const template = this.querySelector<HTMLTemplateElement>(
			'[data-attachment-template]'
		);
		const count = this.querySelector<HTMLElement>('[data-attachment-count]');
		const fileError = this.querySelector<HTMLElement>('.attachment-error');
		const formatSize = (size: number) => {
			const mib = size >= 1024 ** 2;
			const value = mib ? size / 1024 ** 2 : Math.max(1, size / 1024);
			return `${new Intl.NumberFormat(eu ? 'eu' : 'es', {
				maximumFractionDigits: mib ? 1 : 0
			}).format(value)} ${mib ? 'MiB' : 'KiB'}`;
		};
		const showFileError = (message = '') => {
			if (!fileError || !picker) return;
			fileError.textContent = message;
			fileError.hidden = !message;
			picker.toggleAttribute('data-error', Boolean(message));
		};
		const renderFiles = () => {
			if (!list || !template || !count) return;
			list.replaceChildren();
			list.hidden = this.selectedFiles.length === 0;
			this.selectedFiles.forEach((file, index) => {
				const row = template.content.cloneNode(true) as DocumentFragment;
				row.querySelector('[data-file-name]')!.textContent = file.name;
				row.querySelector('[data-file-size]')!.textContent = formatSize(
					file.size
				);
				const remove =
					row.querySelector<HTMLButtonElement>('[data-file-remove]')!;
				remove.setAttribute(
					'aria-label',
					`${eu ? 'Kendu' : 'Quitar'} ${file.name}`
				);
				remove.addEventListener('click', () => {
					this.selectedFiles.splice(index, 1);
					showFileError();
					renderFiles();
					const remaining =
						list.querySelectorAll<HTMLButtonElement>('[data-file-remove]');
					(remaining[Math.min(index, remaining.length - 1)] ?? picker)?.focus();
				});
				list.append(row);
			});
			const total = this.selectedFiles.reduce(
				(size, file) => size + file.size,
				0
			);
			count.textContent = this.selectedFiles.length
				? eu
					? `${this.selectedFiles.length} / ${maxAttachments} fitxategi · ${formatSize(total)} guztira`
					: `${this.selectedFiles.length} de ${maxAttachments} archivos · ${formatSize(total)} en total`
				: '';
		};
		const addFiles = (incoming: File[]) => {
			if (!incoming.length) return;
			const next = [...this.selectedFiles];
			for (const file of incoming) {
				if (file.size > maxAttachmentSize) {
					showFileError(
						eu
							? `«${file.name}» fitxategiak 10 MiB baino gehiago ditu. Aukeratu txikiago bat.`
							: `«${file.name}» supera los 10 MiB. Elige un archivo más pequeño.`
					);
					return;
				}
				if (!isAllowedAttachment(file)) {
					showFileError(
						eu
							? `Ezin da «${file.name}» erantsi. Erabili hutsik ez dagoen JPG, PNG, PDF, DOC, DOCX edo TXT fitxategi bat, baliozko izenarekin.`
							: `No se puede adjuntar «${file.name}». Elige un JPG, PNG, PDF, DOC, DOCX o TXT que no esté vacío y tenga un nombre válido.`
					);
					return;
				}
				if (
					!next.some(
						current =>
							current.name === file.name &&
							current.size === file.size &&
							current.lastModified === file.lastModified
					)
				)
					next.push(file);
			}
			if (next.length > maxAttachments) {
				showFileError(
					eu
						? 'Gehienez 3 fitxategi erantsi ditzakezu. Kendu bat beste bat gehitzeko.'
						: 'Puedes adjuntar hasta 3 archivos. Quita uno para añadir otro.'
				);
				return;
			}
			if (
				next.reduce((size, file) => size + file.size, 0) >
				maxTotalAttachmentSize
			) {
				showFileError(
					eu
						? 'Fitxategiek ezin dute 15 MiB baino gehiago izan guztira. Kendu bat edo aukeratu txikiagoak.'
						: 'Los archivos superan los 15 MiB en total. Quita alguno o elige archivos más pequeños.'
				);
				return;
			}
			this.selectedFiles = next;
			showFileError();
			renderFiles();
		};
		picker?.addEventListener('click', () => input?.click(), { signal });
		input?.addEventListener(
			'change',
			() => {
				addFiles(Array.from(input.files ?? []));
				input.value = '';
			},
			{ signal }
		);
		if (attachments) {
			let dragDepth = 0;
			attachments.addEventListener(
				'dragenter',
				event => {
					if (!event.dataTransfer?.types.includes('Files')) return;
					event.preventDefault();
					dragDepth++;
					attachments.setAttribute('data-dragging', '');
				},
				{ signal }
			);
			attachments.addEventListener(
				'dragover',
				event => {
					if (!event.dataTransfer?.types.includes('Files')) return;
					event.preventDefault();
					event.dataTransfer.dropEffect = 'copy';
				},
				{ signal }
			);
			attachments.addEventListener(
				'dragleave',
				() => {
					dragDepth = Math.max(0, dragDepth - 1);
					if (!dragDepth) attachments.removeAttribute('data-dragging');
				},
				{ signal }
			);
			attachments.addEventListener(
				'drop',
				event => {
					event.preventDefault();
					dragDepth = 0;
					attachments.removeAttribute('data-dragging');
					addFiles(Array.from(event.dataTransfer?.files ?? []));
				},
				{ signal }
			);
		}
		form.addEventListener(
			'reset',
			() => {
				this.selectedFiles = [];
				showFileError();
				renderFiles();
			},
			{ signal }
		);
		renderFiles();
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
				const files = [...this.selectedFiles];
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
