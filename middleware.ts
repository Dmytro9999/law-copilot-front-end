import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/two-factor']
const AUTH_PREFIXES = ['/reset-password']

const isAuthRoute = (pathname: string) =>
	AUTH_ROUTES.includes(pathname) ||
	AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))

export function middleware(req: NextRequest) {
	const { pathname, search } = req.nextUrl
	const hasAuth = Boolean(req.cookies.get('Authentication')?.value)

	// (Опционально) не пускать авторизованных на auth-страницы:
	// имей в виду: по одной лишь куке можно ошибиться, лучше проверять сессию на сервере страницы.
	if (hasAuth && isAuthRoute(pathname)) {
		const url = req.nextUrl.clone()
		url.pathname = '/'
		url.search = ''
		return NextResponse.redirect(url)
	}

	// Статику и API пропускаем
	const isAsset =
		pathname.startsWith('/_next') ||
		pathname.startsWith('/assets') ||
		pathname.startsWith('/images') ||
		pathname === '/favicon.ico'
	const isApi = pathname.startsWith('/api')

	const isProtected = !isAsset && !isApi && !isAuthRoute(pathname)

	if (!hasAuth && isProtected) {
		const url = req.nextUrl.clone()
		url.pathname = '/login'
		url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)'],
}
