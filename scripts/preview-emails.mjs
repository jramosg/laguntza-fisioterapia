import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
	renderContact,
	renderConfirmation
} from '../src/server/contact-emails.ts';

const directory = resolve(process.argv[2] || '/tmp/laguntza-email-preview');
await mkdir(directory, { recursive: true });
for (const file of ['email-logo-white.png', 'email-logo-color.png']) {
	await copyFile(
		new URL(`../public/${file}`, import.meta.url),
		resolve(directory, file)
	);
}

for (const lang of ['eu', 'es']) {
	const input = {
		lang,
		requestId: '00000000-0000-4000-8000-000000000000',
		name: 'Ane Etxeberria',
		email: 'ane@example.com',
		phone: '600 000 000',
		message:
			lang === 'eu'
				? 'Kaixo, Jokin.\n\nDatorren asterako hitzordurik baduzun jakin nahi nuke.\n\nEskerrik asko.'
				: 'Hola, Jokin.\n\nMe gustaría conocer la disponibilidad para la próxima semana.\n\nGracias.',
		website: '',
		attachments: [new File(['%PDF-1.7\nExample'], 'ejemplo.pdf')]
	};
	for (const [kind, rendered] of [
		['confirmation', renderConfirmation(lang)],
		['clinic', renderContact(input)]
	]) {
		await writeFile(
			resolve(directory, `${kind}-${lang}.html`),
			rendered.html.replaceAll(
				'https://laguntzafisioterapia.com/email-logo-',
				'email-logo-'
			)
		);
		await writeFile(resolve(directory, `${kind}-${lang}.txt`), rendered.text);
	}
}

await writeFile(
	resolve(directory, 'index.html'),
	`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Correos · Laguntza Fisioterapia</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#edf0eb;color:#22352f;font-family:Inter,Arial,sans-serif}
    header{padding:32px 40px;background:#22352f;color:#f6f7f2}header p{margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#e8944a}h1{margin:0 0 25px;font-size:32px;letter-spacing:-1px}
    nav{display:flex;gap:10px;flex-wrap:wrap}select,button{padding:11px 15px;border:1px solid #78877f;border-radius:24px;background:transparent;color:#fff;font:inherit;font-size:13px}select{background:#22352f}button{cursor:pointer}button[aria-pressed=true]{background:#e8944a;border-color:#e8944a;color:#22352f}
    main{max-width:1120px;margin:auto;padding:28px 28px 60px}.note{margin:0 0 27px;font-size:12px;color:#53655e}.previews{display:flex;gap:36px;align-items:flex-start;justify-content:center}.view{min-width:0}h2{margin:0 0 14px;font-size:10px;letter-spacing:1.5px;font-weight:400;color:#53655e}iframe{display:block;border:0;background:#edf0eb}#desktop{width:640px}#mobile{width:320px}.night{background:#101b18}.night .note,.night h2{color:#bbc9c1}
    @media(max-width:1060px){.previews{flex-direction:column;align-items:center}#desktop{width:min(640px,calc(100vw - 32px))}header{padding:28px 24px}main{padding-left:16px;padding-right:16px}}
  </style>
</head>
<body>
  <header><p>LAGUNTZA FISIOTERAPIA / EMAIL</p><h1>El cuidado, también en el correo.</h1>
    <nav aria-label="Opciones de vista previa">
      <button data-kind="confirmation" aria-pressed="true">Para quien escribe</button>
      <button data-kind="clinic" aria-pressed="false">Para Jokin</button>
      <select id="language" aria-label="Idioma"><option value="eu">Euskara</option><option value="es" selected>Castellano</option></select>
      <select id="appearance" aria-label="Aspecto"><option value="light">Claro</option><option value="dark">Oscuro</option></select>
    </nav>
  </header>
  <main><p class="note">Vista previa local con datos ficticios. No se envía ningún correo.</p>
    <div class="previews"><section class="view"><h2>ESCRITORIO / 640 PX</h2><iframe id="desktop" title="Correo en escritorio" src="confirmation-es.html"></iframe></section><section class="view"><h2>MÓVIL / 320 PX</h2><iframe id="mobile" title="Correo en móvil" src="confirmation-es.html"></iframe></section></div>
  </main>
  <script>
    let kind='confirmation';
    const frames=[...document.querySelectorAll('iframe')];
    function appearance(frame){
      const doc=frame.contentDocument;
      let style=doc.querySelector('#preview-appearance');
      if(!style){style=doc.createElement('style');style.id='preview-appearance';doc.head.append(style)}
      const source=[...doc.querySelectorAll('head style:not(#preview-appearance)')].map(s=>s.textContent).join('');
      const dark=source.slice(source.indexOf('@media (prefers-color-scheme:dark){')+'@media (prefers-color-scheme:dark){'.length).trim().replace(/}\\s*$/,'');
      style.textContent=document.querySelector('#appearance').value==='dark'?dark:'';
      frame.style.height='0px';
      frame.style.height=(doc.documentElement.scrollHeight+2)+'px';
    }
    frames.forEach(frame=>frame.addEventListener('load',()=>appearance(frame)));
    function update(){frames.forEach(frame=>frame.src=kind+'-'+document.querySelector('#language').value+'.html')}
    document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.kind;document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update()}));
    document.querySelector('#language').addEventListener('change',update);
    document.querySelector('#appearance').addEventListener('change',()=>{document.body.classList.toggle('night',document.querySelector('#appearance').value==='dark');frames.forEach(appearance)});
  </script>
</body>
</html>`
);
console.log(`Email previews written to ${directory}`);
