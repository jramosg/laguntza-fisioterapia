export type Language = 'es' | 'eu';

export function negotiateLanguage(
	manual: string | undefined,
	acceptLanguage: string | null
): Language {
	if (manual === 'es' || manual === 'eu') return manual;
	const preferences = (acceptLanguage || '')
		.split(',')
		.map((entry, position) => {
			const [tag, ...parameters] = entry.trim().toLowerCase().split(';');
			const quality = parameters.find(part => part.trim().startsWith('q='));
			const weight = quality ? Number(quality.trim().slice(2)) : 1;
			return { language: tag.split('-')[0], weight, position };
		})
		.filter(
			({ weight }) => Number.isFinite(weight) && weight > 0 && weight <= 1
		)
		.sort((a, b) => b.weight - a.weight || a.position - b.position);
	const preferred = preferences.find(
		({ language }) => language === 'es' || language === 'eu'
	)?.language;
	return preferred === 'eu' ? 'eu' : 'es';
}
