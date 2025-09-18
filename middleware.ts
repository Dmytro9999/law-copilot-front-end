import { NextResponse, type NextRequest } from 'next/server'

/** --- i18n --- */
const SUPPORTED_LOCALES = ['he', 'en'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'he'
const PUBLIC_FILE = /\.(.*)$/

function i18nRedirect(req: NextRequest): NextResponse | void {
	const { pathname } = req.nextUrl
	if (pathname.startsWith('/_next') || pathname.startsWith('/api') || PUBLIC_FILE.test(pathname))
		return
	const has = SUPPORTED_LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
	if (has) return
	const cookie = req.cookies.get('NEXT_LOCALE')?.value as Locale | undefined
	const locale = cookie && SUPPORTED_LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE
	const url = req.nextUrl.clone()
	url.pathname = `/${locale}${pathname}`
	return NextResponse.redirect(url)
}

function splitLocale(pathname: string): { locale: Locale; rest: string } {
	const parts = pathname.split('/')
	const maybe = parts[1]
	if ((SUPPORTED_LOCALES as readonly string[]).includes(maybe)) {
		const rest = '/' + parts.slice(2).join('/')
		return { locale: maybe as Locale, rest: rest === '/' ? '/' : rest.replace(/\/+$/, '') }
	}
	return { locale: DEFAULT_LOCALE, rest: pathname || '/' }
}

/** --- AUTH CONFIG --- */
const HOME_AFTER_LOGIN = '/'

const PUBLIC_EXACT = new Set<string>([
	'/login',
	'/signup',
	'/signup/1',
	'/forgot-password',
	'/two-factor',
	'/reset-password',
])

const PUBLIC_PATTERNS: RegExp[] = [/^\/reset-password\/.+$/]

const PROTECT_ALL_EXCEPT_PUBLIC = true

const PROTECTED_PREFIXES = ['/home', '/dashboard', '/account', '/settings', 'two-factor']

const PROTECT_ROOT = true

function isPublic(rest: string): boolean {
	if (PUBLIC_EXACT.has(rest)) return true
	return PUBLIC_PATTERNS.some((rx) => rx.test(rest))
}

function isProtected(rest: string): boolean {
	if (PROTECT_ROOT && rest === '/') return true

	if (PROTECT_ALL_EXCEPT_PUBLIC) {
		// всё, что НЕ публичное — приватное
		return !isPublic(rest)
	}
	// иначе — защищаем только указанные префиксы и, при необходимости, корень
	// if (PROTECT_ROOT && rest === '/') return true
	return PROTECTED_PREFIXES.some((pref) => rest === pref || rest.startsWith(pref + '/'))
}

export function middleware(req: NextRequest) {
	// 1) I18N
	const maybe = i18nRedirect(req)
	if (maybe) return maybe

	// 2) AUTH
	const { pathname, search } = req.nextUrl
	const { locale, rest } = splitLocale(pathname)
	const hasAuth = Boolean(req.cookies.get('Authentication')?.value)

	if (!hasAuth && isProtected(rest)) {
		const url = req.nextUrl.clone()
		url.pathname = `/${locale}/login`
		url.search = `?next=${encodeURIComponent(rest + (search || ''))}`
		return NextResponse.redirect(url)
	}

	if (hasAuth && isPublic(rest) && rest !== HOME_AFTER_LOGIN) {
		const url = req.nextUrl.clone()
		url.pathname = `/${locale}${HOME_AFTER_LOGIN}`
		url.search = ''
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)'],
}
