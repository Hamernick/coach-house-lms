import { getLocale as getLocaleBase } from "@/lib/locale"
import type { SupportedLocale } from "@/lib/locale"

export async function getLocale(): Promise<SupportedLocale> {
  return getLocaleBase()
}
