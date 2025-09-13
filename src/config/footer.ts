import { Email, WhatsApp } from '@config/company';
import GithubIcon from '@icons/github.svg';
import EmailIcon from '@icons/email.svg';

export const footerSocials = [
	{
		name: 'Instagram',
		url: 'https://www.instagram.com/laguntzafisioterapia',
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

const authorProps = [
	{
		name: 'Nerea Dorronsoro',
		email: 'nedorronsoro@gmail.com',
		linkedin:
			'https://www.linkedin.com/in/nerea-dorronsoro?miniProfileUrn=urn%3Ali%3Afs_miniProfile%3AACoAACanxTYBorkiEL9X37D09ucf1LDLgrqQ8oE&lipi=urn%3Ali%3Apage%3Ad_flagship3_search_srp_people%3BtbIALkWUQDWbWWzUUvsPhA%3D%3D',
	},
	{
		name: 'Jon Ramos',
		email: 'jonurnieta@gmail.com',
		linkedin: 'https://www.linkedin.com/in/jon-ramos-8ba55a14a/',
		github: 'https://github.com/jramosg',
	},
];

export const authors = authorProps.map(author => ({
	name: author.name,
	socials: [
		{
			name: 'Email',
			url: `mailto:${author.email}`,
			iconType: 'component',
			icon: EmailIcon,
			title: `Email ${author.email}`,
		},
		{
			name: 'LinkedIn',
			url: author.linkedin,
			icon: 'mdi:linkedin',
			title: `Open ${author.name} on LinkedIn`,
		},
		...(author.github
			? [
					{
						name: 'GitHub',
						url: author.github,
						iconType: 'component',
						icon: GithubIcon,
						title: `Open ${author.name} on GitHub`,
					},
				]
			: []),
	],
}));

export type FooterListItem = {
	title: string;
	slug?: string;
	href?: string;
	icon?: string;
};
export type FooterLists = typeof footerLists;
export type FooterSocials = typeof footerSocials;
