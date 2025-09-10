import { type Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n/config'

export function splitLocaleFromPath(pathname: string): { locale: Locale; rest: string } {
	const parts = pathname.split('/')
	const maybe = parts[1]
	if ((SUPPORTED_LOCALES as readonly string[]).includes(maybe)) {
		return { locale: maybe as Locale, rest: '/' + parts.slice(2).join('/') }
	}
	return { locale: DEFAULT_LOCALE, rest: pathname }
}

export function localeHref(href: string, locale: Locale) {
	if (!href.startsWith('/')) return href
	return `/${locale}${href}`
}
