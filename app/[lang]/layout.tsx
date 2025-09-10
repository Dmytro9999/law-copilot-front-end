import type { Locale } from '@/i18n/config'
import { isRTL } from '@/i18n/config'
import { ReduxProvider } from '@/providers/ReduxProvider'
import { Toaster } from '@/components/ui/toaster'
import AuthInit from '@/components/auth/AuthInit'
import { Heebo } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/providers/I18nProvider'
import { getDictionary } from '@/i18n/dictionaries'

export const metadata = {
	title: 'LAWCOPILOT AI - מערכת ניהול חוזים חכמה',
	description:
		'מערכת AI מתקדמת לניהול חוזים והתחייבויות לעורכי דין - מופעלת על ידי Google Gemini',
	generator: 'v0.app',
}

const heebo = Heebo({
	subsets: ['hebrew', 'latin'],
	weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ lang: Locale }>
}) {
	const { lang } = await params
	const dict = await getDictionary(lang)

	return (
		<html lang={lang} dir={isRTL(lang) ? 'rtl' : 'ltr'}>
			<body className={heebo.className}>
				<ReduxProvider>
					<AuthInit />
					<I18nProvider dict={dict} locale={lang}>
						{children}
					</I18nProvider>
					<Toaster />
				</ReduxProvider>
			</body>
		</html>
	)
}

export function generateStaticParams() {
	return [{ lang: 'he' }, { lang: 'en' }]
}
