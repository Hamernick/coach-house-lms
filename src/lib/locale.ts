
import { cookies, headers } from "next/headers"

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/locale/constants"

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

export function getLocale(): SupportedLocale {
  const cookieStore = cookies() as unknown as { get: (name: string) => { value: string } | undefined }
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value

  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale
  }

  const headerStore = headers() as unknown as { get: (name: string) => string | null }
  const headerLocale = parseAcceptLanguage(headerStore.get("accept-language"))

  return headerLocale
}

export function getLocaleCookieName() {
  return LOCALE_COOKIE
}

export { SUPPORTED_LOCALES, type SupportedLocale, isSupportedLocale } from "@/lib/locale/constants"
