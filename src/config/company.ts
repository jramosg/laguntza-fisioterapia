import Prevention from '@images/prevention.webp';
import Rehab from '@images/rehab.webp';
import Puncture from '@images/puncture.webp';
import Interview from '@images/interview.webp';

export const Address = {
	name: 'Zubitxo Plaza, 3, 20130 Urnieta, Gipuzkoa',
	url: 'https://maps.app.goo.gl/ct7ZQvDpocAY3V5ZA'
};

export const Phone = {
	name: '943 036 070',
	url: 'tel:+34943036070'
};

export const Email = {
	name: 'info@laguntzafisioterapia.com',
	url: 'mailto:info@laguntzafisioterapia.com'
};

export const WhatsApp = {
	name: '688 734 113',
	url: 'https://wa.me/688734113',
	urlCall: 'tel:+34688734113'
};

export const sectionImages = {
	'assessment-diagnosis': Interview,
	'exercise-prevention': Prevention,
	'rehab-readaptation': Rehab,
	'specialized-techniques': Puncture
};

export const SERVICES = {
	eu: {
		intro:
			'Fisioterapia, osteopatia, terapia manuala eta errehabilitazio zerbitzuak Gipuzkoan. Zerbitzu guztiak fisioterapeuta espezializatu batek eskaintzen ditu, paziente bakoitzaren egoera, helburu eta beharretara egokituz. Ariketa terapeutiko pertsonalizatuak Urnietan.',
		sections: [
			{
				id: 'assessment-diagnosis',
				title: 'Balorazio eta Diagnostiko Pertsonalizatua',
				desc: `Balorazio eta diagnostiko funtzionala Gipuzkoako gure fisioterapia zerbitzu guztien abiapuntua da. Paziente bakoitzari elkarrizketa, azterketa kliniko eta proba espezifikoak egiten dizkiogu, arazoaren jatorria eta egoera zehatza identifikatzeko. Horrela, tratamendu eta ariketa terapeutiko programak guztiz pertsonalizatuak diseinatzen ditugu Urnietan.`
			},
			{
				id: 'exercise-prevention',
				title: 'Ariketa Terapeutikoak eta Prebentzioa',
				desc: `Ariketa terapeutiko programak Gipuzkoan adin, egoera eta jarduera fisiko guztietako pertsonei egokituta. Errehabilitazio eta ariketa terapeutiko saioak eskaintzen ditugu osasuna mantentzeko, gaitasun fisikoa hobetzeko edo lesioak prebenitzeko gure Urnietako zentroan.`,
				bullets: [
					{
						title: 'Adin luzeekoei zuzendutako ariketa programak',
						desc: 'Indarra, oreka eta autonomia mantentzeko, fragilitatea prebenitzeko eta bizi-kalitatea hobetzeko.'
					},
					{
						title: 'Prebentziora zuzendutako ariketak',
						desc: 'Lesioak saihesteko, osasuna mantentzeko eta gaitasun fisikoa hobetzeko ariketak.'
					}
				]
			},
			{
				id: 'rehab-readaptation',
				title: 'Errehabilitazioa eta Erreadaptazio Funtzionala',
				desc: `Errehabilitazio zerbitzua Gipuzkoan: lesio, ebakuntza edo gaixotasun baten ondoren gaitasun funtzionala eta autonomia berreskuratzeko tratamendu pertsonalizatuak. Ariketa terapeutikoak, terapia manuala eta teknika aurreratuak konbinatzen ditugu pertsona bere jarduera fisiko edo kirol mailara itzultzeko. Indarra, koordinazioa eta segurtasuna lantzen dira, lesioak berriro agertzea saihesteko. Errehabilitazio osoa gure Urnietako zentroan, Guipuzcoan.`
			},
			{
				id: 'specialized-techniques',
				title: 'Fisioterapiako Teknika Espezializatuak',
				desc: '',
				bullets: [
					{
						title: 'Terapia manuala',
						desc: 'Terapia manuala Gipuzkoan. Eskuzko teknika espezializatuak, artikulazio, muskulu eta nerbio sistemaren funtzionamendua hobetzeko, mina arintzeko eta mugimendua berreskuratzeko. Terapia manual zerbitzua gure Urnietako zentroan, Guipuzcoan.'
					},
					{
						title: 'Osteopatia',
						desc: 'Osteopatia zerbitzua Gipuzkoan. Gorputzaren oreka eta funtzio egokia berreskuratzeko esku bidezko tratamendu integrala, ikuspegi holistikoarekin eta pertsonalizazio osoz. Osteopata profesionala Urnietan, Donostia eta Hernanitik gertu, Guipuzcoan.'
					},
					{
						title: 'Puntzio lehorra',
						desc: 'Puntzio lehor teknika Gipuzkoan muskuluetako tentsio eta min puntuak tratatzeko. Orratz finak erabiliz puntu miofaszialak askatzeko eta mina arintzeko. Puntzio lehorra beti balorazio pertsonalizatuaren arabera aplikatzen da gure Urnietako zentroan.'
					},
					{
						title: 'Neuromodulazioa',
						desc: 'Sistema nerbiosoaren jarduera erregulatzeko teknika aurreratuak, mina eta disfuntzio neurologikoak arintzeko. Neuromodulazio perkutaneoa, besteak beste, elektroestimulazioa erabiliz egiten da, eta mugimenduaren eta funtzioaren hobekuntza bilatzen du, pazientearen egoerara egokituta.'
					}
				]
			}
		]
	},
	es: {
		title: 'Servicios',
		intro:
			'Servicios de fisioterapia, osteopatía, terapia manual y rehabilitación en Gipuzkoa. Todos los tratamientos son realizados por un fisioterapeuta especializado, adaptándose a la situación, objetivos y necesidades de cada paciente. Ejercicio terapéutico personalizado en Urnieta.',
		sections: [
			{
				id: 'assessment-diagnosis',
				title: 'Valoración y Diagnóstico Personalizado',
				desc: `La valoración y el diagnóstico funcional son el punto de partida de todos nuestros servicios de fisioterapia en Gipuzkoa. Realizamos una entrevista, exploración clínica y pruebas específicas a cada paciente para identificar el origen del problema y su situación concreta. Así, diseñamos tratamientos y programas de ejercicio terapéutico totalmente personalizados.`
			},
			{
				id: 'exercise-prevention',
				title: 'Ejercicio Terapéutico y Prevención',
				desc: `Programas de ejercicio terapéutico adaptados a personas de cualquier edad, condición y nivel de actividad física en Gipuzkoa. Ofrecemos sesiones de rehabilitación y ejercicio terapéutico para mantener la salud, mejorar la capacidad física o prevenir lesiones en nuestra clínica de Urnieta.`,
				bullets: [
					{
						title: 'Programas de ejercicio para personas mayores',
						desc: 'Para mantener la fuerza, el equilibrio y la autonomía, prevenir la fragilidad y mejorar la calidad de vida.'
					},
					{
						title: 'Ejercicios orientados a la prevención',
						desc: 'Actividades diseñadas para evitar lesiones, mantener la salud y mejorar la condición física.'
					}
				]
			},
			{
				id: 'rehab-readaptation',
				title: 'Rehabilitación y Readaptación Funcional',
				desc: `Servicio de rehabilitación en Gipuzkoa con tratamientos personalizados para recuperar la capacidad funcional y la autonomía tras una lesión, intervención quirúrgica o enfermedad. Combinamos ejercicio terapéutico, terapia manual y técnicas avanzadas para que puedas volver a tu actividad física o deportiva habitual. Se trabajan la fuerza, la coordinación y la seguridad para evitar recaídas. Rehabilitación completa en nuestra clínica de Urnieta, Guipúzcoa.`
			},
			{
				id: 'specialized-techniques',
				title: 'Técnicas Especializadas de Fisioterapia',
				desc: '',
				bullets: [
					{
						title: 'Terapia Manual',
						desc: 'Servicio de terapia manual en Gipuzkoa. Técnicas especializadas de fisioterapia manual para mejorar el funcionamiento de las articulaciones, músculos y sistema nervioso. Tratamiento de terapia manual para aliviar el dolor y recuperar el movimiento en nuestra clínica de Urnieta, Guipúzcoa.'
					},
					{
						title: 'Osteopatía',
						desc: 'Servicio de osteopatía en Gipuzkoa con enfoque holístico. Tratamiento de osteopatía para recuperar el equilibrio y la función corporal mediante técnicas manuales especializadas. Osteópata profesional en Urnieta, cerca de Donostia y Hernani en Guipúzcoa.'
					},
					{
						title: 'Punción Seca',
						desc: 'Técnica invasiva de fisioterapia en Gipuzkoa para tratar puntos de tensión y dolor muscular. Utilizamos agujas finas para liberar puntos miofasciales y aliviar el dolor. Punción seca siempre aplicada según una valoración personalizada en nuestra clínica de Urnieta.'
					},
					{
						title: 'Neuromodulación',
						desc: 'Técnicas avanzadas para regular la actividad del sistema nervioso, aliviar el dolor y tratar disfunciones neurológicas. La neuromodulación percutanea, entre otras, se realiza mediante electroestimulación y busca mejorar el movimiento y la función, adaptándose a la situación del paciente.'
					}
				]
			}
		]
	}
};

export type ServiceBullet = {
	title: string;
	desc: string;
};
