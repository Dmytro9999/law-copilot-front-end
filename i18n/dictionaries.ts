import 'server-only'

const loaders: Record<any, () => Promise<Record<string, any>>> = {
	en: async () => (await import('../messages/en.json')).default,
	he: async () => (await import('../messages/he.json')).default,
} as const

export async function getDictionary(locale: any) {
	const loader = loaders[locale] ?? loaders.he
	return loader()
}
