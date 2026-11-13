import type { ImageMetadata } from 'astro';
import DryNeedling from '@images/dry-needling.jpg';
import Taping from '@images/sports-taping.webp';
import AnkleBand from '@images/ankle-resistance-band.webp';
import Electro from '@images/puncture.webp';
import type { Langs } from '@i18n/ui';

// Service landing pages rendered by src/pages/[lang]/services/[treatment].astro.
// Each entry is one page per language. Copy follows the same rule as the rest
// of the site: describe what happens in the consultation, never promise an
// outcome, and only mention training Jokin actually holds (see
// src/config/practitioner.ts).

type Item = { title: string; text: string };
type Faq = { q: string; a: string };

export type TreatmentCopy = {
	seoTitle: string;
	seoDescription: string;
	label: string;
	heroTitle: string;
	heroSubtitle: string;
	imageAlt: string;
	introAlt: string;
	whatIsTitle: string;
	whatIsText: string;
	detailText: string;
	sessionTitle: string;
	session: Item[];
	forWhomTitle: string;
	forWhom: Item[];
	goalsTitle: string;
	goals: string[];
	safetyTitle: string;
	safety: string[];
	faqTitle: string;
	faq: Faq[];
	card: string;
};

export type Treatment = {
	slug: string;
	// Hero photo. Vertical photos need the 'portrait' layout: the wide banner
	// crops them down to a strip that shows nothing.
	image: ImageMetadata;
	imageLayout: 'wide' | 'portrait';
	imagePosition: string;
	// A different photo for the intro, so the hero is not repeated below it.
	introImage: ImageMetadata;
	introPosition: string;
	copy: Record<Langs, TreatmentCopy>;
};

export const treatments: Treatment[] = [
	{
		slug: 'puncion-seca-gipuzkoa',
		image: DryNeedling,
		imageLayout: 'portrait',
		imagePosition: 'center 70%',
		introImage: Electro,
		introPosition: 'center 40%',
		copy: {
			es: {
				seoTitle: 'Punción seca en Urnieta, Gipuzkoa | Laguntza Fisioterapia',
				seoDescription:
					'Punción seca en Urnieta con fisioterapeuta colegiado y máster en fisioterapia invasiva. Para dolor muscular y puntos gatillo. Cerca de Hernani, Andoain y Donostia.',
				label: 'Punción seca',
				heroTitle: 'Punción seca en Gipuzkoa',
				heroSubtitle:
					'Fisioterapia invasiva para el dolor muscular, en Urnieta y siempre tras una valoración',
				imageAlt:
					'Tratamiento de punción seca en Laguntza Fisioterapia, Urnieta',
				introAlt: 'Agujas de punción con electroestimulación en una pierna',
				whatIsTitle: '¿Qué es la punción seca?',
				whatIsText:
					'La punción seca es una técnica de fisioterapia invasiva en la que se introduce una aguja muy fina, sin ninguna sustancia, en un punto concreto del músculo. Se utiliza sobre todo en puntos gatillo miofasciales: zonas del músculo sensibles a la presión que pueden estar relacionadas con dolor y con limitación del movimiento.',
				detailText:
					'No es acupuntura ni un tratamiento aislado. La planteo como una herramienta más dentro de un plan que suele incluir terapia manual y ejercicio, y solo cuando la exploración indica que puede tener sentido en tu caso. Si prefieres no utilizar agujas, buscamos otra opción.',
				sessionTitle: 'Cómo es una sesión con punción seca',
				session: [
					{
						title: 'Valoración previa',
						text: 'Hablamos de tu dolor, tu salud y tu medicación. Exploro la zona y localizo los puntos que reproducen tus síntomas.'
					},
					{
						title: 'Te explico la técnica',
						text: 'Te cuento qué voy a hacer, qué puedes notar y qué alternativas hay. Solo sigo adelante con tu consentimiento.'
					},
					{
						title: 'Aplicación',
						text: 'Utilizo agujas estériles de un solo uso. Es habitual notar una contracción breve del músculo o una molestia pasajera. Puedes pedirme parar en cualquier momento.'
					},
					{
						title: 'Después',
						text: 'La zona puede quedar sensible uno o dos días, como unas agujetas. Te indico qué hacer en casa y qué ejercicio acompaña al tratamiento.'
					}
				],
				forWhomTitle: '¿Cuándo puede tener sentido?',
				forWhom: [
					{
						title: 'Dolor de cuello y espalda',
						text: 'Cuando la exploración apunta a un componente muscular en el dolor cervical, dorsal o lumbar.'
					},
					{
						title: 'Hombro, codo y cadera',
						text: 'Como parte del tratamiento de sobrecargas y tendinopatías, junto con ejercicio progresivo.'
					},
					{
						title: 'Sobrecarga deportiva',
						text: 'En gemelos, isquiotibiales, cuádriceps o glúteos, ajustando el momento al calendario de entrenamientos.'
					},
					{
						title: 'Cefalea tensional y mandíbula',
						text: 'Cuando la musculatura del cuello o de la masticación participa en los síntomas.'
					}
				],
				goalsTitle: 'Qué buscamos',
				goals: [
					'Reducir la sensibilidad de un punto doloroso',
					'Facilitar un movimiento que está limitado',
					'Tolerar mejor el ejercicio y la carga',
					'Combinarla con trabajo activo, no sustituirlo',
					'Revisar la respuesta antes de repetirla'
				],
				safetyTitle: 'Seguridad y contraindicaciones',
				safety: [
					'La punción seca es un acto sanitario. Soy fisioterapeuta colegiado (COFPV 3618), con máster en fisioterapia invasiva y formación específica en técnicas miofasciales y punción seca.',
					'No se aplica en todos los casos. Avísame si tomas anticoagulantes, si estás embarazada, si tienes miedo a las agujas, alergia a metales, una infección o una enfermedad que afecte a las defensas. En esas situaciones valoramos si conviene o elegimos otra técnica.'
				],
				faqTitle: 'Preguntas frecuentes sobre punción seca',
				faq: [
					{
						q: '¿Duele la punción seca?',
						a: 'Puede resultar molesta durante unos segundos, sobre todo cuando el músculo responde con una contracción breve. Después es frecuente notar la zona cargada durante uno o dos días. Adapto la técnica a lo que toleras.'
					},
					{
						q: '¿Cuántas sesiones hacen falta?',
						a: 'Depende de cada caso. Tras la primera aplicación revisamos cómo has respondido y decidimos si tiene sentido repetirla. No es una técnica que se aplique en todas las sesiones.'
					},
					{
						q: '¿En qué se diferencia de la acupuntura?',
						a: 'Usan agujas parecidas, pero parten de planteamientos distintos. La punción seca se basa en la exploración anatómica y neuromuscular, y se dirige a puntos concretos del músculo identificados en la valoración.'
					},
					{
						q: '¿Puedo hacer deporte después?',
						a: 'Normalmente puedes seguir con actividad suave. Te recomendaré evitar esfuerzos intensos con esa zona durante las primeras 24 a 48 horas, según cómo te encuentres.'
					},
					{
						q: '¿Dónde se hace la punción seca?',
						a: 'En la consulta de Laguntza Fisioterapia, en Zubitxo Plaza 3, Urnieta. Vienen pacientes de Hernani, Andoain, Lasarte-Oria y Donostia. Se atiende con cita previa.'
					}
				],
				card: 'Fisioterapia invasiva para el dolor muscular y los puntos gatillo, tras una valoración individual.'
			},
			eu: {
				seoTitle: 'Puntzio lehorra Urnietan, Gipuzkoa | Laguntza Fisioterapia',
				seoDescription:
					'Puntzio lehorra Urnietan, fisioterapeuta elkargokide eta fisioterapia inbaditzaileko masterdunarekin. Muskulu-minerako eta gatillo-puntuetarako. Hernani, Andoain eta Donostiatik gertu.',
				label: 'Puntzio lehorra',
				heroTitle: 'Puntzio lehorra Gipuzkoan',
				heroSubtitle:
					'Fisioterapia inbaditzailea muskulu-minerako, Urnietan eta beti balorazio baten ondoren',
				imageAlt:
					'Puntzio lehorreko tratamendua Laguntza Fisioterapian, Urnietan',
				introAlt: 'Puntzio-orratzak elektroestimulazioarekin hanka batean',
				whatIsTitle: 'Zer da puntzio lehorra?',
				whatIsText:
					'Puntzio lehorra fisioterapia inbaditzaileko teknika bat da: orratz oso fin bat, inolako substantziarik gabe, muskuluaren puntu jakin batean sartzen da. Batez ere gatillo-puntu miofaszialetan erabiltzen da, hau da, presioarekiko sentikorrak diren eta minarekin edo mugimenduaren mugarekin lotuta egon daitezkeen muskulu-guneetan.',
				detailText:
					'Ez da akupuntura, ezta tratamendu isolatu bat ere. Plan baten barruko tresna bat gehiago da niretzat, normalean terapia manualarekin eta ariketarekin batera, eta azterketak zure kasuan zentzua izan dezakeela adierazten duenean bakarrik erabiltzen dut. Orratzik nahi ez baduzu, beste aukera bat bilatuko dugu.',
				sessionTitle: 'Nolakoa da puntzio lehorreko saio bat',
				session: [
					{
						title: 'Aurretiko balorazioa',
						text: 'Zure minaz, osasunaz eta botikez hitz egingo dugu. Gunea aztertu eta zure sintomak eragiten dituzten puntuak bilatuko ditut.'
					},
					{
						title: 'Teknika azalduko dizut',
						text: 'Zer egingo dudan, zer nabari dezakezun eta zer aukera dauden esango dizut. Zure baimenarekin bakarrik jarraituko dut.'
					},
					{
						title: 'Aplikazioa',
						text: 'Erabilera bakarreko orratz esterilak erabiltzen ditut. Ohikoa da muskuluaren uzkurdura labur bat edo une bateko ondoeza nabaritzea. Edozein unetan gelditzeko eska dezakezu.'
					},
					{
						title: 'Ondoren',
						text: 'Gunea sentikor gera daiteke egun batez edo biz, aguxetak balira bezala. Etxean zer egin eta tratamenduarekin batera zer ariketa egin azalduko dizut.'
					}
				],
				forWhomTitle: 'Noiz izan dezake zentzua?',
				forWhom: [
					{
						title: 'Lepoko eta bizkarreko mina',
						text: 'Azterketak lepoko, bizkarreko edo gerrialdeko minean muskulu-osagai bat dagoela adierazten duenean.'
					},
					{
						title: 'Sorbalda, ukondoa eta aldaka',
						text: 'Gainkargen eta tendinopatien tratamenduaren zati gisa, ariketa progresiboarekin batera.'
					},
					{
						title: 'Kirol-gainkarga',
						text: 'Bikietan, iskiotibialetan, kuadrizepsean edo gluteoetan, unea entrenamendu-egutegira egokituz.'
					},
					{
						title: 'Tentsio-buruko mina eta masailezurra',
						text: 'Lepoko edo mastekatzeko muskuluek sintometan parte hartzen dutenean.'
					}
				],
				goalsTitle: 'Zer bilatzen dugu',
				goals: [
					'Puntu mingarri baten sentikortasuna gutxitzea',
					'Mugatuta dagoen mugimendu bat erraztea',
					'Ariketa eta karga hobeto jasatea',
					'Lan aktiboarekin uztartzea, ez ordezkatzea',
					'Erantzuna berrikustea errepikatu aurretik'
				],
				safetyTitle: 'Segurtasuna eta kontraindikazioak',
				safety: [
					'Puntzio lehorra osasun-ekintza bat da. Fisioterapeuta elkargokidea naiz (COFPV 3618), fisioterapia inbaditzaileko masterra eta teknika miofaszialetan eta puntzio lehorrean prestakuntza espezifikoa ditut.',
					'Ez da kasu guztietan aplikatzen. Esan iezadazu antikoagulanteak hartzen badituzu, haurdun bazaude, orratzei beldurra badiezu, metalei alergia baduzu, edo infekzio bat edo defentsei eragiten dien gaixotasun bat baduzu. Egoera horietan komeni den baloratuko dugu, edo beste teknika bat aukeratuko dugu.'
				],
				faqTitle: 'Puntzio lehorrari buruzko ohiko galderak',
				faq: [
					{
						q: 'Min ematen du puntzio lehorrak?',
						a: 'Segundo batzuez deserosoa izan daiteke, batez ere muskuluak uzkurdura labur batekin erantzuten duenean. Ondoren, ohikoa da gunea kargatuta nabaritzea egun batez edo biz. Teknika zuk jasaten duzunera egokitzen dut.'
					},
					{
						q: 'Zenbat saio behar dira?',
						a: 'Kasuaren araberakoa da. Lehen aplikazioaren ondoren nola erantzun duzun aztertuko dugu, eta errepikatzeak zentzurik duen erabakiko dugu. Ez da saio guztietan aplikatzen den teknika.'
					},
					{
						q: 'Zertan bereizten da akupunturatik?',
						a: 'Antzeko orratzak erabiltzen dituzte, baina abiapuntu desberdina dute. Puntzio lehorra azterketa anatomiko eta neuromuskularrean oinarritzen da, eta balorazioan identifikatutako muskulu-puntu jakinetara zuzentzen da.'
					},
					{
						q: 'Kirola egin dezaket ondoren?',
						a: 'Normalean jarduera arinarekin jarrai dezakezu. Lehen 24-48 orduetan gune horrekin ahalegin handiak saihestea gomendatuko dizut, nola zauden kontuan hartuta.'
					},
					{
						q: 'Non egiten da puntzio lehorra?',
						a: 'Laguntza Fisioterapiako kontsultan, Urnietako Zubitxo Plaza 3an. Hernani, Andoain, Lasarte-Oria eta Donostiatik etortzen dira pazienteak. Aldez aurreko hitzorduarekin artatzen da.'
					}
				],
				card: 'Fisioterapia inbaditzailea muskulu-minerako eta gatillo-puntuetarako, banakako balorazio baten ondoren.'
			}
		}
	},
	{
		slug: 'fisioterapia-deportiva-gipuzkoa',
		image: Taping,
		imageLayout: 'portrait',
		imagePosition: 'center 45%',
		introImage: AnkleBand,
		introPosition: 'center 60%',
		copy: {
			es: {
				seoTitle:
					'Fisioterapia deportiva en Urnieta, Gipuzkoa | Laguntza Fisioterapia',
				seoDescription:
					'Fisioterapia deportiva y readaptación de lesiones en Urnieta. Fisioterapeuta del Deusto FC con máster en readaptación deportiva. Cerca de Hernani, Andoain y Donostia.',
				label: 'Fisioterapia deportiva',
				heroTitle: 'Fisioterapia deportiva en Gipuzkoa',
				heroSubtitle:
					'Lesiones deportivas y vuelta a la actividad, en Urnieta y a tu ritmo',
				imageAlt: 'Vendaje neuromuscular en la rodilla de un deportista',
				introAlt: 'Ejercicio de tobillo con banda elástica',
				whatIsTitle: '¿Qué es la fisioterapia deportiva?',
				whatIsText:
					'La fisioterapia deportiva se ocupa de las lesiones y molestias relacionadas con el deporte y la actividad física: desde una sobrecarga o un esguince hasta la recuperación después de una operación. El objetivo no es solo que deje de doler, sino que puedas volver a entrenar o competir con confianza.',
				detailText:
					'Trabajo como fisioterapeuta del equipo sénior del Deusto FC y tengo un máster en readaptación deportiva. Eso me permite acompañarte en todo el recorrido: la valoración de la lesión, el tratamiento en camilla cuando hace falta y, sobre todo, la progresión de carga hasta tu deporte. Da igual que corras, juegues a fútbol o a pelota, vayas al monte o hagas CrossFit.',
				sessionTitle: 'Cómo trabajamos una lesión deportiva',
				session: [
					{
						title: 'Entender la lesión',
						text: 'Cómo ocurrió, qué deporte haces, cuánto entrenas y qué tienes por delante. Exploro la zona y las capacidades que tu deporte te exige.'
					},
					{
						title: 'Calmar y proteger',
						text: 'En la fase inicial ajustamos la carga para que el tejido se recupere sin parar más de lo necesario. Terapia manual o punción seca si encajan.'
					},
					{
						title: 'Recuperar capacidad',
						text: 'Fuerza, movilidad y control con ejercicios que progresan según tu respuesta, no según un calendario fijo.'
					},
					{
						title: 'Volver a tu deporte',
						text: 'Reintroducimos carrera, saltos, cambios de dirección o gestos específicos de forma gradual, con criterios claros para cada paso.'
					}
				],
				forWhomTitle: 'Lesiones que veo con frecuencia',
				forWhom: [
					{
						title: 'Lesiones musculares',
						text: 'Roturas de fibras y sobrecargas en isquiotibiales, gemelos, cuádriceps o aductores.'
					},
					{
						title: 'Esguinces y rodilla',
						text: 'Esguince de tobillo, dolor de rodilla al correr y recuperación tras cirugía de menisco o ligamento.'
					},
					{
						title: 'Tendinopatías',
						text: 'Tendón de Aquiles, rotuliano, hombro o codo, con un plan de carga progresiva.'
					},
					{
						title: 'Prevención y carga',
						text: 'Si encadenas molestias o vuelves tras un parón, revisamos cómo entrenas y qué te falta reforzar.'
					}
				],
				goalsTitle: 'Qué buscamos',
				goals: [
					'Saber qué tienes y qué puedes seguir haciendo',
					'Parar solo lo necesario',
					'Recuperar fuerza y confianza en la zona lesionada',
					'Volver a entrenar con una progresión clara',
					'Reducir el riesgo de recaída'
				],
				safetyTitle: 'Coordinación con tu entorno',
				safety: [
					'Si te ha visto un traumatólogo o un médico deportivo, trabajo con sus indicaciones y con las pruebas que tengas. Si durante la valoración aparece algo que conviene que revise un médico, te lo diré.',
					'Cuando entrenas con un club o un preparador, podemos coordinar la carga para que la recuperación y el entrenamiento vayan en la misma dirección.'
				],
				faqTitle: 'Preguntas frecuentes sobre fisioterapia deportiva',
				faq: [
					{
						q: '¿Tengo que dejar de entrenar?',
						a: 'No necesariamente. En muchos casos se puede seguir con parte de la actividad, adaptando la carga. Lo decidimos tras la valoración y lo revisamos según evolucionas.'
					},
					{
						q: '¿Cuándo debo ir al fisio tras una lesión?',
						a: 'Cuanto antes tengas una valoración, antes sabrás qué hacer y qué evitar. Si hay mucha hinchazón, deformidad o no puedes apoyar, acude primero a un servicio médico.'
					},
					{
						q: '¿Atiendes solo a deportistas federados?',
						a: 'No. Atiendo a cualquier persona activa: quien compite, quien sale a correr o al monte los fines de semana y quien quiere empezar a moverse sin lesionarse.'
					},
					{
						q: '¿Cuánto tardaré en volver?',
						a: 'Depende de la lesión, del deporte y de tu punto de partida. Tras la valoración puedo darte una orientación y los criterios que marcarán cada fase.'
					},
					{
						q: '¿Dónde está la consulta?',
						a: 'En Zubitxo Plaza 3, Urnieta, cerca de Hernani, Andoain, Lasarte-Oria y Donostia. Se atiende con cita previa por WhatsApp o teléfono.'
					}
				],
				card: 'Lesiones deportivas y readaptación para volver a entrenar y competir con confianza.'
			},
			eu: {
				seoTitle:
					'Kirol-fisioterapia Urnietan, Gipuzkoa | Laguntza Fisioterapia',
				seoDescription:
					'Kirol-fisioterapia eta lesioen erreadaptazioa Urnietan. Deusto FCko fisioterapeuta, kirol-erreadaptazioko masterrarekin. Hernani, Andoain eta Donostiatik gertu.',
				label: 'Kirol-fisioterapia',
				heroTitle: 'Kirol-fisioterapia Gipuzkoan',
				heroSubtitle:
					'Kirol-lesioak eta jarduerara itzulera, Urnietan eta zure erritmoan',
				imageAlt: 'Bendaje neuromuskularra kirolari baten belaunean',
				introAlt: 'Orkatilako ariketa banda elastikoarekin',
				whatIsTitle: 'Zer da kirol-fisioterapia?',
				whatIsText:
					'Kirol-fisioterapiak kirolarekin eta jarduera fisikoarekin lotutako lesioak eta ondoezak lantzen ditu: gainkarga edo bihurritu batetik hasi eta ebakuntza baten ondorengo errekuperazioraino. Helburua ez da mina kentzea bakarrik, baizik eta berriro konfiantzaz entrenatu edo lehiatu ahal izatea.',
				detailText:
					'Deusto FCko senior taldeko fisioterapeuta naiz, eta kirol-erreadaptazioko masterra dut. Horri esker, bide osoan lagun zaitzaket: lesioaren balorazioan, behar denean ohatilako tratamenduan eta, batez ere, zure kirolera iritsi arteko karga-progresioan. Berdin dio korrika egiten duzun, futbolean edo pilotan jokatzen duzun, mendira joaten zaren edo CrossFit egiten duzun.',
				sessionTitle: 'Nola lantzen dugu kirol-lesio bat',
				session: [
					{
						title: 'Lesioa ulertu',
						text: 'Nola gertatu zen, zer kirol egiten duzun, zenbat entrenatzen duzun eta zer duzun aurretik. Gunea eta zure kirolak eskatzen dizkizun gaitasunak aztertuko ditut.'
					},
					{
						title: 'Lasaitu eta babestu',
						text: 'Hasierako fasean karga egokituko dugu, ehuna berreskura dadin behar baino gehiago gelditu gabe. Terapia manuala edo puntzio lehorra, egokiak badira.'
					},
					{
						title: 'Gaitasuna berreskuratu',
						text: 'Indarra, mugikortasuna eta kontrola, zure erantzunaren arabera aurrera egiten duten ariketekin, ez egutegi finko baten arabera.'
					},
					{
						title: 'Zure kirolera itzuli',
						text: 'Lasterketa, jauziak, norabide-aldaketak edo keinu espezifikoak pixkanaka sartuko ditugu berriro, urrats bakoitzerako irizpide argiekin.'
					}
				],
				forWhomTitle: 'Maiz ikusten ditudan lesioak',
				forWhom: [
					{
						title: 'Muskulu-lesioak',
						text: 'Zuntz-hausturak eta gainkargak iskiotibialetan, bikietan, kuadrizepsean edo aduktoreetan.'
					},
					{
						title: 'Bihurrituak eta belauna',
						text: 'Orkatilako bihurritua, korrika egitean belauneko mina, eta menisko edo lotailuko ebakuntzaren ondorengo errekuperazioa.'
					},
					{
						title: 'Tendinopatiak',
						text: 'Akilesen tendoia, tendoi errotulianoa, sorbalda edo ukondoa, karga progresiboko plan batekin.'
					},
					{
						title: 'Prebentzioa eta karga',
						text: 'Ondoezak kateatzen badituzu edo geldialdi baten ondoren itzultzen bazara, nola entrenatzen duzun eta zer indartu behar duzun aztertuko dugu.'
					}
				],
				goalsTitle: 'Zer bilatzen dugu',
				goals: [
					'Zer duzun eta zer egiten jarrai dezakezun jakitea',
					'Behar dena bakarrik gelditzea',
					'Lesionatutako gunean indarra eta konfiantza berreskuratzea',
					'Progresio argi batekin entrenatzera itzultzea',
					'Berriro lesionatzeko arriskua gutxitzea'
				],
				safetyTitle: 'Zure ingurunearekin koordinazioa',
				safety: [
					'Traumatologo edo kirol-mediku batek ikusi bazaitu, haren jarraibideekin eta dituzun probekin lan egingo dut. Balorazioan mediku batek berrikustea komeni den zerbait agertzen bada, esango dizut.',
					'Klub edo prestatzaile batekin entrenatzen baduzu, karga koordina dezakegu, errekuperazioa eta entrenamendua norabide berean joan daitezen.'
				],
				faqTitle: 'Kirol-fisioterapiari buruzko ohiko galderak',
				faq: [
					{
						q: 'Entrenatzeari utzi behar diot?',
						a: 'Ez nahitaez. Kasu askotan jardueraren zati batekin jarrai daiteke, karga egokituz. Balorazioaren ondoren erabakiko dugu, eta zure bilakaeraren arabera berrikusiko dugu.'
					},
					{
						q: 'Noiz joan behar dut fisioterapeutarengana lesio baten ondoren?',
						a: 'Zenbat eta lehenago balorazio bat izan, orduan eta lehenago jakingo duzu zer egin eta zer saihestu. Hantura handia, deformazioa edo oina bermatzeko ezintasuna badago, joan lehenengo mediku-zerbitzu batera.'
					},
					{
						q: 'Kirolari federatuak bakarrik artatzen dituzu?',
						a: 'Ez. Pertsona aktibo oro artatzen dut: lehiatzen dena, asteburuetan korrika edo mendira ateratzen dena eta lesionatu gabe mugitzen hasi nahi duena.'
					},
					{
						q: 'Zenbat denbora beharko dut itzultzeko?',
						a: 'Lesioaren, kirolaren eta zure abiapuntuaren araberakoa da. Balorazioaren ondoren orientazio bat eta fase bakoitza markatuko duten irizpideak eman diezazkizuket.'
					},
					{
						q: 'Non dago kontsulta?',
						a: 'Urnietako Zubitxo Plaza 3an, Hernani, Andoain, Lasarte-Oria eta Donostiatik gertu. Aldez aurreko hitzorduarekin artatzen da, WhatsApp edo telefono bidez.'
					}
				],
				card: 'Kirol-lesioak eta erreadaptazioa, konfiantzaz entrenatzera eta lehiatzera itzultzeko.'
			}
		}
	}
];
