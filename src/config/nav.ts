export const nav = [
	{
		title: 'nav.home',
		slug: '/',
	},
	{
		title: 'nav.services',
		slug: '/blog',
	},
	{
		title: 'nav.blog',
		slug: '/blog',
	},
	{
		title: 'nav.about',
		slug: '/company/about',
	},
	{
		title: 'nav.contact',
		slug: '/company/contact',
	},
] as const;

export type Nav = typeof nav;
