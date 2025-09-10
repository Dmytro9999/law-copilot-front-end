export const SUPPORTED_LOCALES = ['he', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'he'
export const isRTL = (l: string) => l === 'he'
