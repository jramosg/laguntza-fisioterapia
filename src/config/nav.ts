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
		title: 'inauguration.title',
		slug: '/inauguracion'
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
