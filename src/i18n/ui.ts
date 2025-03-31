export const defaultLang = 'eu';

export const ui = {
	es: {
		'nav.home': 'Inicio',
		'nav.services': 'Servicios',
		'nav.blog': 'Blog',
		'nav.about': 'Sobre mí',
		'nav.contact': 'Contacto',
		'Laguntza fisioterapiari buruz': 'Sobre Laguntza Fisioterapia',
		Erdera: 'Español',
		Euskera: 'Euskera',
		'Kaixo!': '¡Hola!',
		'Ireki menua': 'Abrir menú',
		'Itxi menua': 'Cerrar menú',
		'seo.main-description':
			'Laguntza Fisioterapia es un centro de fisioterapia en Urnieta, especializado en el tratamiento del dolor y la readaptación de lesiones deportivas. Ofrecemos atención personalizada para mejorar tu bienestar y recuperación.',
		'home-hero-desc':
			'Soy especialista en fisioterapia invasiva y experto en la readaptación de lesiones deportivas por la UPNA. Trato a los pacientes mediante tratamientos activos y pasivos con el fin de conseguir los mejores resultados. Considero imprescindible educar al paciente en el conocimiento de su cuerpo y patología y me gusta mantenerme actualizado en la evidencia científica. Actualmente soy fisioterapeuta en el Deusto FC, y anteriormente ejercí mi trabajo en clínicas y como profesor de estiramientos y control postural.',
		'Menua ireki': 'Abrir menú',
		'Menua itxi': 'Cerrar menú',
	},
	eu: {
		'nav.home': 'Hasiera',
		'nav.services': 'Zerbitzuak',
		'nav.blog': 'Bloga',
		'nav.about': 'Niri buruz',
		'nav.contact': 'Kontaktua',
		'seo.main-description':
			'Laguntza fisioterapia Urnietan kokatutako zentrua da, minaren tratamenduan eta lesioen berregokitzean espezializatua. Zure ongizatea eta errekuperazioa hobetzeko arreta pertsonalizatua eskaintzen dugu.',
		'home-hero-desc':
			'Fisioterapia inbaditzailean espezialista naiz eta UPNAko kirol-lesioen berregokitzean aditua. Pazienteak tratamendu aktibo eta pasiboen bidez tratatzen ditut, emaitzarik onenak lortzeko helburuarekin. Pazienteari bere gorputza eta patologia ezagutzen irakasea hartzen dut helburutzat, eta etengabe eguneratuta egotea gustatzen zait ebidentzia zientifikoaren inguruan. Gaur egun Deusto FC taldean, klinika batean eta jarrera-kontrola irakasten egiten dut lan.',
	},
};

export type Langs = keyof typeof ui;
