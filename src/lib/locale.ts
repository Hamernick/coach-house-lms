
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

export async function getLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value

  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale
  }

  const headerStore = await headers()
  const headerLocale = parseAcceptLanguage(headerStore.get("accept-language"))

  return headerLocale
}

export function getLocaleCookieName() {
  return LOCALE_COOKIE
}

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  isSupportedLocale,
} from "@/lib/locale/constants"
