export const nav = [
	{
		title: 'nav.home',
		slug: '/'
	},
	{
		title: 'nav.services',
		slug: '/services'
	},
	{
		title: 'nav.about',
		slug: '/about'
	},
	{
		title: 'nav.contact',
		slug: '/contact'
	}
];

export type NavItem = {
	title: string;
	slug?: string;
};
