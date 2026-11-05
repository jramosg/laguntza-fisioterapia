import type { ContactInput } from './contact-schema.ts';

type Language = ContactInput['lang'];
export type EmailTemplate = { html: string; text: string };

const website = 'https://laguntzafisioterapia.com';
const font = 'font-family:Inter,Arial,Helvetica,sans-serif;';
const copy = {
	eu: {
		confirmationSubject: 'Zure mezua jaso dut · Laguntza Fisioterapia',
		clinicSubject: 'Kontsulta berria · Laguntza Fisioterapia',
		preheader: 'Zure mezua jaso dut. Lehenbailehen erantzungo dizut.',
		eyebrow: 'HARREMANETAN GAUDE',
		title: 'Eskerrik asko<br />idazteagatik.',
		intro:
			'Zure mezua Laguntzara iritsi da. Patxadaz irakurriko dut, eta lehenbailehen jarriko naiz zurekin harremanetan.',
		profession: 'Fisioterapeuta',
		contactTitle: 'Nirekin lehenago hitz egin nahi baduzu',
		contactBody: 'WhatsApp bidez idatz dezakezu edo kontsultara deitu.',
		call: 'Kontsultara deitu',
		appointment:
			'Mezu honek zure mezua jaso dudala baieztatzen du. Hitzorduaren eguna eta ordua nirekin adostuko dituzu.',
		clinicPreheader: 'Webgunetik kontsulta berri bat iritsi da.',
		clinicEyebrow: 'WEBGUNEKO INPRIMAKIA / EUSKARA',
		clinicTitle: 'Kontsulta<br />berri bat.',
		clinicIntro:
			'Pertsona batek webgunetik idatzi dizu. Hemen duzu bere mezua.',
		name: 'IZEN-ABIZENAK',
		email: 'EMAILA',
		phone: 'TELEFONOA',
		noPhone: 'Ez da zehaztu',
		message: 'MEZUA',
		attachments: 'DOKUMENTU ERANTSIAK',
		noAttachments: 'Ez da dokumenturik erantsi.',
		reply: 'Mezuari erantzun',
		replyHelp: 'Email honi zuzenean erantzunez ere jar zaitezke harremanetan.',
		privateNotice:
			'Barne erabilerarako mezua. Informazio pertsonala edo osasun datuak izan ditzake.',
		address: 'Zubitxo Plaza, 3 · 2. etxabea',
		directions: 'Nola iritsi',
		web: 'Webgunea',
		privacy: 'Pribatutasuna'
	},
	es: {
		confirmationSubject: 'He recibido tu mensaje · Laguntza Fisioterapia',
		clinicSubject: 'Nueva consulta · Laguntza Fisioterapia',
		preheader: 'He recibido tu mensaje. Te responderé lo antes posible.',
		eyebrow: 'ESTAMOS EN CONTACTO',
		title: 'Gracias por<br />escribirme.',
		intro:
			'Tu mensaje ha llegado a Laguntza. Lo leeré con calma y me pondré en contacto contigo lo antes posible.',
		profession: 'Fisioterapeuta',
		contactTitle: 'Si necesitas hablar conmigo antes',
		contactBody: 'Puedes escribirme por WhatsApp o llamar a la consulta.',
		call: 'Llamar a la consulta',
		appointment:
			'Este correo confirma que he recibido tu mensaje. El día y la hora de tu cita los acordaremos personalmente.',
		clinicPreheader: 'Ha llegado una nueva consulta desde la web.',
		clinicEyebrow: 'FORMULARIO WEB / CASTELLANO',
		clinicTitle: 'Una nueva<br />consulta.',
		clinicIntro:
			'Una persona te ha escrito desde la web. Aquí tienes su mensaje.',
		name: 'NOMBRE Y APELLIDOS',
		email: 'EMAIL',
		phone: 'TELÉFONO',
		noPhone: 'No indicado',
		message: 'MENSAJE',
		attachments: 'DOCUMENTOS ADJUNTOS',
		noAttachments: 'No se han adjuntado documentos.',
		reply: 'Responder al mensaje',
		replyHelp: 'También puedes responder directamente a este correo.',
		privateNotice:
			'Mensaje para uso interno. Puede contener información personal o datos de salud.',
		address: 'Zubitxo Plaza, 3 · Bajo 2',
		directions: 'Cómo llegar',
		web: 'Visitar la web',
		privacy: 'Privacidad'
	}
};

function escapeHtml(value: string) {
	return value.replace(
		/[&<>"']/g,
		char =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[char]!
	);
}

function paragraph(text: string, style = '') {
	return `<p class="body-copy" style="margin:0;${font}font-size:16px;line-height:27px;color:#53655e;${style}">${text}</p>`;
}

function button(label: string, href: string) {
	return `<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#e8944a" style="border-radius:28px;mso-padding-alt:15px 25px;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 25px;border:1px solid #e8944a;border-radius:28px;${font}font-size:14px;line-height:20px;font-weight:700;color:#22352f;text-decoration:none;text-align:center;">${escapeHtml(label)}</a></td></tr></table>`;
}

function frame(
	lang: Language,
	preheader: string,
	title: string,
	content: string
) {
	const c = copy[lang];
	return `<!doctype html>
<html lang="${lang}" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(title)}</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    table{border-collapse:collapse}img{border:0;outline:none;text-decoration:none}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
    @media only screen and (max-width:600px){
      .outer-pad{padding:16px 8px!important}.content-pad{padding-left:26px!important;padding-right:26px!important}
      .header-pad{padding:28px 26px 0!important}.hero-title{font-size:36px!important;line-height:39px!important;letter-spacing:-1.3px!important}
      .hero-pad{padding-top:36px!important;padding-bottom:32px!important}.footer-pad{padding:30px 26px!important}
      .location{display:none!important}.data-cell{display:block!important;width:auto!important;padding-right:0!important}
      .secondary-cell{padding-top:20px!important}.body-copy{font-size:16px!important}
    }
    @media (prefers-color-scheme:dark){
      .email-bg{background-color:#101b18!important}.paper{background-color:#1a2a24!important}
      .ink,.hero-title{color:#f3f5ef!important}.body-copy,.muted{color:#bbc9c1!important}
      .rule{border-color:#3d5148!important}.note-panel{background-color:#24382e!important}
      .teal-link,.eyebrow{color:#9ec9d2!important}
      .logo-plate{background-color:#1a2a24!important}.logo-light{display:none!important}
      .logo-dark{display:block!important;max-height:none!important;overflow:visible!important}
    }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;width:100%;background-color:#edf0eb;${font}">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="email-bg" bgcolor="#edf0eb">
    <tr><td class="outer-pad" align="center" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="640" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="paper" bgcolor="#ffffff" style="max-width:640px;background-color:#ffffff;">
        <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#458295;"><table role="presentation" width="64" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#e8944a" height="4" style="height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td class="header-pad" style="padding:36px 48px 0;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
            <td align="left"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="logo-plate" bgcolor="#ffffff" style="padding:8px;border-radius:8px;"><a href="${website}/${lang}/" style="text-decoration:none;"><img class="logo-light" src="${website}/email-logo-color.png" width="164" height="39" alt="Laguntza Fisioterapia" style="display:block;width:164px;height:39px;${font}font-size:14px;color:#315f6d;" /><!--[if !mso]><!--><img class="logo-dark" src="${website}/email-logo-white.png" width="164" height="39" alt="Laguntza Fisioterapia" style="display:none;max-height:0;overflow:hidden;width:164px;height:39px;mso-hide:all;${font}font-size:14px;color:#ffffff;" /><!--<![endif]--></a></td></tr></table></td>
            <td class="location muted" align="right" valign="middle" style="${font}font-size:10px;line-height:18px;letter-spacing:1.7px;color:#63746c;">URNIETA<br />GIPUZKOA</td>
          </tr></table>
        </td></tr>
        ${content}
        <tr><td class="footer-pad" bgcolor="#2d5965" style="padding:36px 48px;background-color:#2d5965;">
          <a href="${website}/${lang}/" style="text-decoration:none;"><img src="${website}/email-logo-white.png" width="188" height="45" alt="Laguntza Fisioterapia" style="display:block;width:188px;height:45px;margin-bottom:24px;${font}font-size:15px;color:#ffffff;" /></a>
          <p style="margin:0 0 18px;${font}font-size:13px;line-height:21px;color:#e1ecee;">${c.address}<br />20130 Urnieta · Gipuzkoa</p>
          <p style="margin:0;${font}font-size:12px;line-height:24px;color:#ffffff;"><a href="https://maps.app.goo.gl/ct7ZQvDpocAY3V5ZA" style="color:#ffffff;text-decoration:underline;">${c.directions}</a>&nbsp;&nbsp; · &nbsp;&nbsp;<a href="${website}/${lang}/" style="color:#ffffff;text-decoration:underline;">${c.web}</a>&nbsp;&nbsp; · &nbsp;&nbsp;<a href="${website}/${lang}/privacy/" style="color:#ffffff;text-decoration:underline;">${c.privacy}</a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <p class="muted" style="margin:20px 0 0;${font}font-size:11px;line-height:18px;color:#53655e;">© ${new Date().getFullYear()} Laguntza Fisioterapia</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function hero(eyebrow: string, title: string, body: string) {
	return `<tr><td class="content-pad hero-pad" style="padding:42px 48px 36px;">
    <p class="eyebrow" style="margin:0 0 19px;${font}font-size:10px;line-height:17px;letter-spacing:1.8px;font-weight:700;color:#3a7180;">${eyebrow}</p>
    <h1 class="hero-title" style="margin:0 0 23px;${font}font-size:44px;line-height:47px;letter-spacing:-1.8px;font-weight:700;color:#22352f;">${title}</h1>
    ${paragraph(body)}
  </td></tr>`;
}

function plainFooter(lang: Language) {
	return `Laguntza Fisioterapia\n${copy[lang].address}\n20130 Urnieta · Gipuzkoa\n943 036 070 · 688 734 113\n${website}/${lang}/\n${copy[lang].privacy}: ${website}/${lang}/privacy/`;
}

// This renderer deliberately accepts only the locale, never visitor details.
export function renderConfirmation(lang: Language): EmailTemplate {
	const c = copy[lang];
	const content = `${hero(c.eyebrow, c.title, c.intro)}
    <tr><td class="content-pad" style="padding:0 48px 36px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td width="32" valign="top" style="padding-top:8px;"><table role="presentation" width="20" border="0" cellpadding="0" cellspacing="0"><tr><td bgcolor="#e8944a" height="2" style="height:2px;line-height:2px;font-size:0;">&nbsp;</td></tr></table></td><td>
        <p class="ink" style="margin:0 0 3px;${font}font-size:16px;line-height:22px;font-weight:700;color:#22352f;">Jokin Ramos</p>
        <p class="muted" style="margin:0;${font}font-size:12px;line-height:19px;color:#63746c;">${c.profession}</p>
      </td></tr></table>
    </td></tr>
    <tr><td class="content-pad" style="padding:0 48px;"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td class="rule" style="border-top:1px solid #dde5de;height:1px;font-size:0;line-height:1px;">&nbsp;</td></tr></table></td></tr>
    <tr><td class="content-pad" style="padding:30px 48px 36px;">
      <h2 class="ink" style="margin:0 0 8px;${font}font-size:16px;line-height:24px;font-weight:700;color:#22352f;">${c.contactTitle}</h2>
      ${paragraph(c.contactBody, 'margin-bottom:22px;font-size:14px;line-height:23px;')}
      ${button('WhatsApp · 688 734 113', 'https://wa.me/34688734113')}
      <p class="muted" style="margin:18px 0 0;${font}font-size:13px;line-height:22px;color:#63746c;">${c.call}</p>
      <p style="margin:0;${font}font-size:13px;line-height:22px;"><a class="teal-link" href="tel:+34943036070" style="display:inline-block;padding:11px 0;color:#315f6d;text-decoration:underline;white-space:nowrap;">943 036 070</a>&nbsp;&nbsp; · &nbsp;&nbsp;<a class="teal-link" href="tel:+34688734113" style="display:inline-block;padding:11px 0;color:#315f6d;text-decoration:underline;white-space:nowrap;">688 734 113</a></p>
    </td></tr>
    <tr><td class="content-pad" style="padding:0 48px 32px;">${paragraph(c.appointment, 'font-size:12px;line-height:20px;')}</td></tr>`;
	return {
		html: frame(lang, c.preheader, c.confirmationSubject, content),
		text: `${c.title.replace('<br />', ' ')}\n\n${c.intro}\n\nJokin Ramos\n${c.profession}\n\n${c.contactTitle}\n${c.contactBody}\nWhatsApp: https://wa.me/34688734113\n${c.call}: 943 036 070 · 688 734 113\n\n${c.appointment}\n\n${plainFooter(lang)}`
	};
}

function field(label: string, value: string) {
	return `<p class="muted" style="margin:0 0 7px;${font}font-size:10px;line-height:17px;letter-spacing:1.4px;font-weight:700;color:#63746c;">${label}</p><p class="ink" style="margin:0;${font}font-size:15px;line-height:24px;color:#22352f;word-break:break-word;overflow-wrap:anywhere;">${value}</p>`;
}

export function renderContact(input: ContactInput): EmailTemplate {
	const c = copy[input.lang];
	const mailto = `mailto:${encodeURIComponent(input.email)}`;
	const files = input.attachments.length
		? input.attachments.map(file => escapeHtml(file.name)).join('<br />')
		: c.noAttachments;
	const content = `${hero(c.clinicEyebrow, c.clinicTitle, c.clinicIntro)}
    <tr><td class="content-pad" style="padding:0 48px 30px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td class="rule" style="border-top:1px solid #dde5de;padding-top:25px;">${field(c.name, escapeHtml(input.name))}</td></tr></table>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr>
        <td class="data-cell" width="65%" valign="top" style="padding:23px 20px 0 0;">${field(c.email, `<a class="teal-link" href="${escapeHtml(mailto)}" style="color:#315f6d;text-decoration:underline;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(input.email)}</a>`)}</td>
        <td class="data-cell secondary-cell" width="35%" valign="top" style="padding-top:23px;">${field(c.phone, escapeHtml(input.phone || c.noPhone))}</td>
      </tr></table>
    </td></tr>
    <tr><td class="content-pad" style="padding:0 48px 28px;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td class="note-panel" bgcolor="#f1f5f1" style="padding:23px 24px;background-color:#f1f5f1;border-radius:12px;">${field(c.message, escapeHtml(input.message).replace(/\r\n|\r|\n/g, '<br />'))}</td></tr></table>
    </td></tr>
    <tr><td class="content-pad" style="padding:0 48px 28px;">${field(c.attachments + (input.attachments.length ? ` / ${input.attachments.length}` : ''), files)}</td></tr>
    <tr><td class="content-pad" style="padding:0 48px 28px;">${button(c.reply, mailto)}${paragraph(c.replyHelp, 'margin-top:15px;font-size:12px;line-height:20px;')}</td></tr>
    <tr><td class="content-pad" style="padding:0 48px 30px;">${paragraph(c.privateNotice, 'font-size:12px;line-height:20px;')}</td></tr>`;
	return {
		html: frame(input.lang, c.clinicPreheader, c.clinicSubject, content),
		text: `${c.clinicSubject}\n\n${c.name}: ${input.name}\n${c.email}: ${input.email}\n${c.phone}: ${input.phone || c.noPhone}\n\n${c.message}\n${input.message}\n\n${c.attachments}\n${input.attachments.length ? input.attachments.map(file => file.name).join('\n') : c.noAttachments}\n\n${c.replyHelp}\n\n${c.privateNotice}\n\n${plainFooter(input.lang)}`
	};
}

export function emailSubjects(lang: Language) {
	return {
		clinic: copy[lang].clinicSubject,
		confirmation: copy[lang].confirmationSubject
	};
}
