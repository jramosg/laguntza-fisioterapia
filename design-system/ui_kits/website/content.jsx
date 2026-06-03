// Shared content (ES + EU), lifted from src/i18n/ui.ts and company.ts
const L = {
  es: {
    nav: { home: 'Inicio', services: 'Servicios', about: 'Sobre mí', contact: 'Contacto' },
    cta: 'Pedir cita',
    hero: { h1: 'Fisioterapia y Osteopatía en Gipuzkoa', sub: 'Centro de fisioterapia en Urnieta · Tratamiento personalizado y rehabilitación', more: 'Ver más' },
    intro: 'En Laguntza Fisioterapia creemos que cada persona merece un tratamiento adaptado a su situación. Desde nuestro centro en Urnieta, Gipuzkoa, ofrecemos un servicio de fisioterapia integral donde cada paciente recibe atención individual.',
    about: { label: 'Fisioterapeuta y Osteópata', title: 'Conoce a tu fisioterapeuta', text: 'Soy Jokin Ramos, fisioterapeuta colegiado con más de 10 años de experiencia en el ámbito clínico, deportivo y domiciliario. A lo largo de mi trayectoria he trabajado con cientos de personas ayudándolas a recuperar su movilidad y calidad de vida.', cta: 'Conoce mi trayectoria completa' },
    svcOverview: { title: 'Tratamientos personalizados para cada necesidad', text: 'En Laguntza Fisioterapia ofrecemos una atención integral que abarca desde la valoración y el diagnóstico funcional hasta la rehabilitación completa y la readaptación deportiva. Cada tratamiento parte de una valoración personalizada.' },
    specialtiesTitle: 'Nuestras especialidades',
    specialties: ['Tratamiento del dolor agudo y crónico','Rehabilitación postquirúrgica','Lesiones deportivas','Terapia manual y osteopatía','Técnicas avanzadas: punción seca y neuromodulación','Atención personalizada a mayores'],
    whyTitle: '¿Por qué elegir Laguntza Fisioterapia?',
    why: [
      { t: 'Atención Personalizada', d: 'Cada paciente es único. Realizo una valoración completa para diseñar el tratamiento específico que necesitas.' },
      { t: 'Proximidad', d: 'Ubicado en Urnieta, somos tu centro de fisioterapia local accesible desde toda la comarca.' },
      { t: 'Formación Continua', d: 'Actualización constante en técnicas y metodologías basadas en evidencia científica.' },
      { t: 'Enfoque Integral', d: 'Tratamos el cuerpo como un todo, entendiendo la biomecánica y las compensaciones para un resultado duradero.' },
    ],
    ctaCard: { title: '¿Necesitas tratamiento?', text: 'Contacta con nosotros para una valoración personalizada y comenzar tu recuperación.' },
    services: [
      { title: 'Valoración y Diagnóstico Personalizado', desc: 'El punto de partida de todos nuestros servicios: entrevista, exploración clínica y pruebas específicas para identificar el origen del problema.', img: 'prevention.webp' },
      { title: 'Ejercicio Terapéutico y Prevención', desc: 'Programas adaptados a cualquier edad y nivel para mantener la salud, mejorar la capacidad física o prevenir lesiones.', img: 'prevention.webp' },
      { title: 'Rehabilitación y Readaptación', desc: 'Tratamientos personalizados para recuperar la capacidad funcional y la autonomía tras una lesión o intervención.', img: 'puncture.webp' },
      { title: 'Técnicas Especializadas', desc: 'Terapia manual, osteopatía, punción seca y neuromodulación, aplicadas según una valoración personalizada.', img: 'puncture.webp' },
    ],
    svcPageIntro: 'Servicios de fisioterapia, osteopatía, terapia manual y rehabilitación en Gipuzkoa. Todos los tratamientos son realizados por un fisioterapeuta especializado.',
    contact: { title: 'Ponte en contacto', sub: 'Te responderemos a tu consulta lo antes posible.', name: 'Nombre', namePh: 'Tu nombre', emailPh: 'tu@email.com', phone: 'Teléfono', phoneHelp: 'Opcional · Para responder por WhatsApp', message: 'Mensaje', messagePh: 'Cuéntanos tu caso…', messageHelp: 'Describe cuál es tu problema y cuándo comenzó', send: 'Enviar mensaje', okTitle: '¡Mensaje enviado!', okText: 'Nos pondremos en contacto contigo pronto.' },
    footerScroll: 'Desplázate',
  },
  eu: {
    nav: { home: 'Hasiera', services: 'Zerbitzuak', about: 'Niri buruz', contact: 'Kontaktua' },
    cta: 'Hitzordua hartu',
    hero: { h1: 'Fisioterapia eta Osteopatia Gipuzkoan', sub: 'Fisioterapia zentroa Urnietan · Tratamendu pertsonalizatua eta errehabilitazioa', more: 'Ikusi gehiago' },
    intro: 'Laguntza Fisioterapian pertsona bakoitzak bere egoerara egokitutako tratamendua merezi duela sinesten dugu. Urnietako gure zentrotik, Gipuzkoaren bihotzean, fisioterapia zerbitzu integrala eskaintzen dugu, paziente bakoitzari arreta indibiduala emanez.',
    about: { label: 'Fisioterapeuta eta Osteopata', title: 'Ezagutu zure fisioterapeuta', text: 'Jokin Ramos naiz, fisioterapeuta kolegiatua, 10 urte baino gehiagoko esperientziarekin arlo klinikoan, kirolekoan eta etxeko arretakoan. Nire ibilbidean zehar ehunka pertsonarekin lan egin dut, mugikortasuna eta bizi-kalitatea berreskuratzen lagunduz.', cta: 'Ezagutu nire ibilbide osoa' },
    svcOverview: { title: 'Behar bakoitzera egokitutako tratamenduak', text: 'Laguntza Fisioterapian arreta integrala eskaintzen dugu, balorazio eta diagnostiko funtzionaletik errehabilitazio oso eta kirol erreadaptaziora. Tratamendu bakoitza balorazio pertsonalizatu batekin hasten da.' },
    specialtiesTitle: 'Gure espezialitateak',
    specialties: ['Mina akutua eta kronikoaren tratamendua','Kirurgiari ondorengo errehabilitazioa','Kirol-lesioak','Terapia manuala eta osteopatia','Teknika aurreratuak: puntzio lehorra eta neuromodulazioa','Adindun pertsonen arreta pertsonalizatua'],
    whyTitle: 'Zergatik aukeratu Laguntza Fisioterapia?',
    why: [
      { t: 'Arreta Pertsonalizatua', d: 'Paziente bakoitza bakarra da. Balorazio osoa egiten dut behar duzun tratamendua diseinatzeko.' },
      { t: 'Gertutasuna', d: 'Urnietan kokatua, eskualde osotik eskuragarri dagoen zure fisioterapia zentroa.' },
      { t: 'Jarraitutako Prestakuntza', d: 'Etengabe eguneratzen ari gara ebidentzia zientifikoan oinarritutako teknikak eta metodologiak.' },
      { t: 'Ikuspegi Integrala', d: 'Gorputza osoa tratatzen dugu, biomekanika ulertuz emaitza iraunkorra lortzeko.' },
    ],
    ctaCard: { title: 'Tratamendua behar duzu?', text: 'Jarri gurekin harremanetan balorazio pertsonalizatu bat egiteko eta zure berreskurapena hasteko.' },
    services: [
      { title: 'Balorazio eta Diagnostiko Pertsonalizatua', desc: 'Gure zerbitzu guztien abiapuntua: elkarrizketa, azterketa kliniko eta proba espezifikoak, arazoaren jatorria identifikatzeko.', img: 'prevention.webp' },
      { title: 'Ariketa Terapeutikoak eta Prebentzioa', desc: 'Adin eta maila guztietara egokitutako programak, osasuna mantentzeko edo lesioak prebenitzeko.', img: 'prevention.webp' },
      { title: 'Errehabilitazioa eta Erreadaptazioa', desc: 'Tratamendu pertsonalizatuak gaitasun funtzionala eta autonomia berreskuratzeko lesio edo ebakuntza baten ondoren.', img: 'puncture.webp' },
      { title: 'Teknika Espezializatuak', desc: 'Terapia manuala, osteopatia, puntzio lehorra eta neuromodulazioa, balorazio pertsonalizatuaren arabera.', img: 'puncture.webp' },
    ],
    svcPageIntro: 'Fisioterapia, osteopatia, terapia manuala eta errehabilitazio zerbitzuak Gipuzkoan. Zerbitzu guztiak fisioterapeuta espezializatu batek eskaintzen ditu.',
    contact: { title: 'Harremanetan jarri', sub: 'Zure kontsulta lehenbailehen erantzungo dugu.', name: 'Izena', namePh: 'Zure izena', emailPh: 'zu@email.com', phone: 'Telefonoa', phoneHelp: 'Aukerakoa · WhatsApp bidez erantzuteko', message: 'Mezua', messagePh: 'Kontaiguzu zure kasua…', messageHelp: 'Azaldu zein den zure arazoa eta noiz hasi zen', send: 'Bidali mezua', okTitle: 'Mezua bidali da!', okText: 'Laster jarriko gara harremanetan.' },
    footerScroll: 'Behera',
  },
};

const COMPANY = {
  address: 'Zubitxo Plaza, 3, 20130 Urnieta, Gipuzkoa',
  phone: '943 036 070',
  whatsapp: '688 734 113',
  email: 'info@laguntzafisioterapia.com',
};

const A = '../../assets'; // asset base

window.L = L;
window.COMPANY = COMPANY;
window.A = A;
