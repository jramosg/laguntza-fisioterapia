import { Langs } from "@i18n/ui";

export type Slug = `/${string}`;

export interface Frontmatter {
	title: string;
	description: string;
	authors: string[];
	publishDate: string;
	featuredImage: string;
    excerpt: string;
    lang: Langs
}
