export const defaultLang = 'eu';

export const ui = {
	es: {
		'Laguntza fisioterapiari buruz': 'Sobre Laguntza Fisioterapia',
		Erdera: 'Español',
		Euskera: 'Euskera',
		'Kaixo!': '¡Hola!',
		'Ireki menua': 'Abrir menú',
		'Itxi menua': 'Cerrar menú',
		'seo.main-description':
			'Laguntza Fisioterapia es un centro de fisioterapia en Urnieta, especializado en el tratamiento del dolor y la readaptación de lesiones deportivas. Ofrecemos atención personalizada para mejorar tu bienestar y recuperación.',
	},
	eu: {
		'seo.main-description':
			'Laguntza fisioterapia Urnietan kokatutako zentrua da, minaren tratamenduan eta lesioen berregokitzean espezializatua. Zure ongizatea eta errekuperazioa hobetzeko arreta pertsonalizatua eskaintzen dugu.',
	},
} as const;

export type Langs = keyof typeof ui;
