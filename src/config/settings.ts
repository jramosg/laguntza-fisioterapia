export const settings = {
	title: `Laguntza Fisioterapia | Centro de Fisioterapia en Urnieta, Gipuzkoa`,
	description: `seo.main-description`,
	descriptionBillingual:
		'Fisioterapia zentroa Urnietan, minaren tratamenduan eta lesioen berregokitzean espezializatua. Osteopatia, puntzio lehorra eta neuromodulazioa. Gipuzkoan kokatutako klinika modernoa. / Centro de fisioterapia en Urnieta, Gipuzkoa, especializado en tratamiento del dolor y rehabilitación de lesiones. Osteopatía, punción seca y neuromodulación. Fisioterapeuta profesional.',
	url: `https://laguntzafisioterapia.com`,
	name: `Laguntza Fisioterapia`,
	keywords: {
		es: 'fisioterapia Urnieta, fisioterapeuta Gipuzkoa, tratamiento dolor, rehabilitación lesiones, osteopatía, punción seca, neuromodulación, centro fisioterapia, Zubitxo Plaza',
		eu: 'fisioterapia Urnieta, fisioterapeuta Gipuzkoa, minaren tratamendua, lesioen berregokitzea, osteopatia, puntzio lehorra, neuromodulazioa, fisioterapia zentroa, Zubitxo Plaza'
	}
} as const;

export type Settings = typeof settings;
