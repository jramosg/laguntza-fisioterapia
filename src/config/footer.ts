import { Address, Email, WhatsApp } from '@config/company';

export const footerSocials = [
	{
		name: 'Instagram',
		url: 'https://www.instagram.com/jon95ramos/?hl=es',
		icon: 'mdi:instagram',
	},
	{
		name: 'WhatsaApp',
		url: WhatsApp.url,
		icon: 'mdi:whatsapp',
	},
	{
		name: 'Email',
		url: Email.url,
		icon: 'mdi:email-outline',
	},
] as const;

export const footerLists = [
	{
		title: 'nav.home',
		slug: '/',
	},
	{
		title: 'nav.services',
		slug: '/services',
	},
	{
		title: 'nav.contact',
		slug: '/contact',
	},
];

export type FooterListItem = {
	title: string;
	slug?: string;
	href?: string;
	icon?: string;
};
export type FooterLists = typeof footerLists;
export type FooterSocials = typeof footerSocials;
