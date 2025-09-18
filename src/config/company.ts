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
			'Zerbitzu guztiak fisioterapeuta espezializatu batek eskaintzen ditu, paziente bakoitzaren egoera helburu eta beharretara egokituz.',
		sections: [
			{
				id: 'assessment-diagnosis',
				title: 'Balorazio eta Diagnostiko Pertsonalizatua',
				desc: `Balorazio eta diagnostiko funtzionala zerbitzu guztien abiapuntua da. Paziente bakoitzari elkarrizketa, azterketa kliniko eta proba espezifikoak egiten dizkiogu, arazoaren jatorria eta egoera zehatza identifikatzeko. Horrela, tratamendu eta ariketa programak guztiz pertsonalizatuak diseinatzen ditugu.`
			},
			{
				id: 'exercise-prevention',
				title: 'Ariketa eta Prebentzio Programak',
				desc: `Adin, egoera eta jarduera fisiko guztietako pertsonei egokitutako ariketa saioak eskaintzen ditugu, osasuna mantentzeko, gaitasun fisikoa hobetzeko edo lesioak prebenitzeko.`,
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
				title: 'Errehabilitazio eta erreadaptazioa',
				desc: `Lesio, ebakuntza edo gaixotasun baten ondoren gaitasun funtzionala eta autonomia berreskuratzeko tratamendua. Helburua pertsona bere jarduera fisiko edo kirol mailara itzultzea. Indarra, koordinazioa eta segurtasuna lantzen dira, lesioak berriro agertzea saihesteko. Prozesu hau ere guztiz pertsonalizatua da.`
			},
			{
				id: 'specialized-techniques',
				title: 'Teknika Espezializatuak',
				desc: '',
				bullets: [
					{
						title: 'Terapia manuala',
						desc: 'Eskuzko teknika espezializatuak, artikulazio, muskulu eta nerbio sistemaren funtzionamendua hobetzeko, mina arintzeko eta mugimendua berreskuratzeko. Tratamendu bakoitza pazientearen beharretara egokituta eskaintzen dugu.'
					},
					{
						title: 'Osteopatia',
						desc: 'Gorputzaren oreka eta funtzio egokia berreskuratzeko esku bidezko tratamendu integrala, ikuspegi holistikoarekin eta pertsonalizazio osoz.'
					},
					{
						title: 'Puntzio lehorra',
						desc: 'Muskuluetako tentsio eta min puntuak tratatzeko teknika inbaditzailea, orratz finak erabiliz puntu miofaszialak askatzeko eta mina arintzeko. Beti balorazio pertsonalizatuaren arabera aplikatzen da.'
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
			'Todos los servicios son realizados por un fisioterapeuta especializado, adaptándose a la situación, objetivos y necesidades de cada paciente.',
		sections: [
			{
				id: 'assessment-diagnosis',
				title: 'Valoración y Diagnóstico Personalizado',
				desc: `La valoración y el diagnóstico funcional son el punto de partida de todos nuestros servicios. Realizamos una entrevista, exploración clínica y pruebas específicas a cada paciente para identificar el origen del problema y su situación concreta. Así, diseñamos tratamientos y programas de ejercicio totalmente personalizados.`
			},
			{
				id: 'exercise-prevention',
				title: 'Programas de Ejercicio y Prevención',
				desc: `Ofrecemos sesiones de ejercicio adaptadas a personas de cualquier edad, condición y nivel de actividad física, para mantener la salud, mejorar la capacidad física o prevenir lesiones.`,
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
				title: 'Rehabilitación y Readaptación',
				desc: `Tratamientos personalizados para recuperar la capacidad funcional y la autonomía tras una lesión, intervención quirúrgica o enfermedad. El objetivo es que la persona pueda volver a su actividad física o deportiva habitual. Se trabajan la fuerza, la coordinación y la seguridad para evitar recaídas. Este proceso también es completamente personalizado.`
			},
			{
				id: 'specialized-techniques',
				title: 'Técnicas Especializadas',
				desc: '',
				bullets: [
					{
						title: 'Terapia manual y osteopatía',
						desc: 'Técnicas para mejorar el funcionamiento de las articulaciones, músculos y sistema nervioso, aliviar el dolor y recuperar el movimiento. La osteopatía ofrece un enfoque holístico para recuperar el equilibrio y la función corporal, siempre con personalización.'
					},
					{
						title: 'Punción seca',
						desc: 'Técnica invasiva para tratar puntos de tensión y dolor muscular, utilizando agujas finas para liberar puntos miofasciales y aliviar el dolor. Siempre se aplica según una valoración personalizada.'
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
