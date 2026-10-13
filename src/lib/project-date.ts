/** Database project dates are serialized as UTC-midnight Date values. */
export function projectDateToLocalCalendar(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Calendar selections represent local days, not instants in UTC. */
export function projectDateToValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function formatProjectDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}
