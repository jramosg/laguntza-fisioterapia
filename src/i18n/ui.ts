export const languages = {
	eu: 'Euskera',
	es: 'Español',
};

export const defaultLang = 'eu';

export const ui = {
	es: {
		'Laguntza fisioterapiari buruz': 'Sobre Laguntza Fisioterapia',
		'Erdera': 'Español',
		'Euskera': 'Euskera',
		'Kaixo!': '¡Hola!'
	},
	eu: {},
} as const;

export type Langs = keyof typeof ui;
