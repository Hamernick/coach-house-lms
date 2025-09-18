import { cookies, headers } from "next/headers"

import {
  SupportedLocale,
  getLocaleCookieName,
  isSupportedLocale,
  parseAcceptLanguage,
} from "@/lib/locale"

export function getLocale(): SupportedLocale {
  const cookieStore = cookies()
  const cookieLocale = cookieStore.get(getLocaleCookieName())?.value

  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale
  }

  const headerStore = headers()
  return parseAcceptLanguage(headerStore.get("accept-language"))
}
