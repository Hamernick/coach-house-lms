export const SUPPORTED_LOCALES = ["en-US", "es-ES", "fr-FR"] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "en-US"

export const LOCALE_COOKIE = "coach_locale"

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}
