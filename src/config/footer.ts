export const footerSocials = [
	{
		name: 'Twitter',
		url: 'https://twitter.com/jaydanurwin',
		icon: 'mdi:twitter',
	},
	{
		name: 'Youtube',
		url: 'https://youtube.com/@jaydanurwin',
		icon: 'mdi:youtube',
	},
] as const;

export const footerLists = [
	{
		title: 'Laguntza fisioterapia',
		items: [
			{
				title: 'nav.about',
				slug: '/company/about',
			},
			{
				title: 'nav.blog',
				slug: '/blog',
			},
			{
				title: 'Urnieta, Idiazabal kalea, 22, 2A',
				slug: '/company/contact',
				href: 'https://maps.app.goo.gl/9KVD7uFCZvc4FvTv7',
			},
		],
	},
] as const;

export type FooterLists = typeof footerLists;
export type FooterSocials = typeof footerSocials;
