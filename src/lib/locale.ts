export const SUPPORTED_LOCALES = ["en-US", "es-ES", "fr-FR"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "en-US"
const LOCALE_COOKIE = "coach_locale"

export function parseAcceptLanguage(value: string | null): SupportedLocale {
  if (!value) {
    return DEFAULT_LOCALE
  }

  const locales = value
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean)

  for (const locale of locales) {
    const normalized = SUPPORTED_LOCALES.find((item) => item.toLowerCase() === locale.toLowerCase())
    if (normalized) {
      return normalized
    }
  }

  return DEFAULT_LOCALE
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

export function getLocaleCookieName() {
  return LOCALE_COOKIE
}
