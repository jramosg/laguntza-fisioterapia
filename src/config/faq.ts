import type { Langs } from '@i18n/ui';

export type FaqItem = { q: string; a: string };

type Bilingual = { eu: string; es: string };
type FaqSource = { q: Bilingual; a: Bilingual };

// Single source of truth for the FAQ. Both the visible <FAQ> section and the
// FAQPage structured data read from here, so the markup and schema can never
// drift apart (a Google requirement for FAQ rich results).
const faq: FaqSource[] = [
	{
		q: {
			eu: 'Non dago kokatuta Laguntza Fisioterapia zentroa?',
			es: '¿Dónde estáis y qué zonas de Gipuzkoa atendéis?'
		},
		a: {
			eu: 'Zubitxo Plaza 3, 20130 Urnieta (Gipuzkoa). Donostia, Hernani, Andoain, Lasarte-Oria eta Astigarragatik oso gertu, aparkaleku erosoarekin eta garraio publikoa inguruan.',
			es: 'Estamos en Zubitxo Plaza 3, 20130 Urnieta (Gipuzkoa), muy cerca de Donostia, Hernani, Andoain, Lasarte-Oria y Astigarraga. Hay aparcamiento cómodo y transporte público en los alrededores.'
		}
	},
	{
		q: {
			eu: 'Zer zerbitzu eskaintzen dituzue?',
			es: '¿Qué servicios ofrecéis?'
		},
		a: {
			eu: 'Fisioterapia orokorra, osteopatia, terapia manuala, puntzio lehorra, neuromodulazioa, errehabilitazioa eta ariketa terapeutikoak.',
			es: 'Fisioterapia general, osteopatía, terapia manual, punción seca, neuromodulación, rehabilitación y ejercicio terapéutico.'
		}
	},
	{
		q: {
			eu: 'Zein da ordutegia?',
			es: '¿Cuál es el horario?'
		},
		a: {
			eu: 'Astelehena eta asteazkena: 08:00–13:30 eta 19:30–21:30. Asteartea eta osteguna: 08:00–13:30. Ostirala: 15:00–21:30.',
			es: 'Lunes y miércoles: 08:00–13:30 y 19:30–21:30. Martes y jueves: 08:00–13:30. Viernes: 15:00–21:30.'
		}
	},
	{
		q: {
			eu: 'Nola har dezaket hitzordua?',
			es: '¿Cómo pido cita?'
		},
		a: {
			eu: 'Telefonoz 943 036 070 zenbakira deituz, WhatsApp bidez 688 734 113 zenbakira, edo info@laguntzafisioterapia.com helbidera idatziz.',
			es: 'Por teléfono en el 943 036 070, por WhatsApp en el 688 734 113 o escribiendo a info@laguntzafisioterapia.com.'
		}
	},
	{
		q: {
			eu: 'Fisioterapeutak titulazio profesionala al du?',
			es: '¿El fisioterapeuta está colegiado?'
		},
		a: {
			eu: 'Bai. Jokin Ramos fisioterapeuta kolegiatua da, Euskal Herriko Fisioterapeuten Elkargo Profesionalean, eta osteopatian espezializatua.',
			es: 'Sí. Jokin Ramos es fisioterapeuta colegiado en el Colegio Profesional de Fisioterapeutas del País Vasco y está especializado en osteopatía.'
		}
	},
	{
		q: {
			eu: 'Zer da puntzio lehorra?',
			es: '¿Qué es la punción seca?'
		},
		a: {
			eu: 'Orratz fin bat erabiltzen duen teknika bat da, muskuluetako tentsio eta min puntuak (puntu gatillo miofaszialak) tratatzeko.',
			es: 'Es una técnica que utiliza una aguja fina para tratar los puntos de tensión y dolor muscular (puntos gatillo miofasciales).'
		}
	}
];

export function getFaq(lang: Langs): FaqItem[] {
	return faq.map(({ q, a }) => ({ q: q[lang], a: a[lang] }));
}
