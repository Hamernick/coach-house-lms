import { DEFAULT_LOCALE, type SupportedLocale } from "@/lib/locale/constants"

type DateOptions = Intl.DateTimeFormatOptions

type NumberOptions = Intl.NumberFormatOptions

export function formatCurrency(amount: number, currency: string, locale: SupportedLocale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function formatDateTime(
  value: string | number | Date,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: DateOptions = {}
) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date)
}

export function formatDate(
  value: string | number | Date,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: DateOptions = {}
) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...options,
  }).format(date)
}

export function formatNumber(value: number, locale: SupportedLocale = DEFAULT_LOCALE, options: NumberOptions = {}) {
  return new Intl.NumberFormat(locale, options).format(value)
}
