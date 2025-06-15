export const nav = [
	{
		title: 'nav.home',
		slug: '/',
	},
	{
		title: 'nav.services',
		slug: '/services',
	},
	{
		title: 'nav.services',
		slug: '/blog',
	},
	{
		title: 'nav.about',
		slug: '/about',
	},
	{
		title: 'nav.contact',
		slug: '/contact',
	},
] as const;

export type Nav = typeof nav;
