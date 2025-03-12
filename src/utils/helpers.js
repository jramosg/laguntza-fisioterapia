export function generateSlug(string) {
	return string
		.toString()
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '');
}

export function generateTagData(categories) {
	let categoryData = [];
	categories.forEach(category => {
		categoryData.push({
			title: category,
			slug: `${generateSlug(category)}`,
		});
	});
	return categoryData;
}

import { getRelativeLocaleUrlList } from 'astro:i18n';

export function generateStaticPaths() {
	const availableUrlList = getRelativeLocaleUrlList();

	// Filter and transform the URLs
	const filteredUrlList = availableUrlList
		.filter(url => url !== '/') // Remove the root URL '/'
		.map(url => url.replace(/^\/|\/$/g, '')); // Remove leading and trailing slashes

	// Generate paths for static generation
	return filteredUrlList.map(lang => ({
		params: { lang }, // Use the cleaned-up language code
	}));
}