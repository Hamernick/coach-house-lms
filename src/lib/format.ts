import { getLocale } from "@/lib/locale"

type DateOptions = Intl.DateTimeFormatOptions

type NumberOptions = Intl.NumberFormatOptions

export function formatCurrency(amount: number, currency: string, locale = getLocale()) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function formatDateTime(value: string | number | Date, options: DateOptions = {}) {
  const locale = getLocale()
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date)
}

export function formatDate(value: string | number | Date, options: DateOptions = {}) {
  const locale = getLocale()
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...options,
  }).format(date)
}

export function formatNumber(value: number, options: NumberOptions = {}) {
  const locale = getLocale()
  return new Intl.NumberFormat(locale, options).format(value)
}
