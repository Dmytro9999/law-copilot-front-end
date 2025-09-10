'use client'

import { usePathname, useRouter } from 'next/navigation'

const LOCALES = (process.env.NEXT_PUBLIC_LOCALES ?? 'he,en')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean) as Array<'he' | 'en'>

export default function LocaleSelect() {
	const pathname = usePathname()
	const router = useRouter()

	// текущая локаль и остаток пути
	const [, curr, ...restParts] = pathname.split('/')
	const currLocale = curr === 'he' || curr === 'en' ? curr : 'he'
	const rest = '/' + restParts.join('/')

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const next = e.target.value as 'he' | 'en'
		document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=31536000`
		const nextPath = `/${next}${rest === '/' ? '' : rest}`
		router.replace(nextPath)
	}

	if (LOCALES.length <= 1) return null

	return (
		<select value={currLocale} onChange={onChange} className='border rounded px-2 py-1'>
			{LOCALES.map((l) => (
				<option key={l} value={l}>
					{l.toUpperCase()}
				</option>
			))}
		</select>
	)
}
