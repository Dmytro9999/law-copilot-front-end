'use client'
import { createContext, useContext } from 'react'

type Dict = Record<string, any>
const Ctx = createContext<{ dict: Dict; locale: string }>({ dict: {}, locale: 'he' })

export function I18nProvider({ dict, locale, children }: any) {
	return <Ctx.Provider value={{ dict, locale }}>{children}</Ctx.Provider>
}

export function useI18n() {
	const { dict } = useContext(Ctx)
	const get = (o: any, p: string) => p.split('.').reduce((x, k) => (x ? x[k] : undefined), o)
	return { t: (path: string, fallback?: string) => get(dict, path) ?? fallback ?? path }
}

export function useLocale() {
	return useContext(Ctx).locale
}
