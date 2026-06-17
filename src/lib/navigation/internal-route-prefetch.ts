export function isInternalPrefetchHref(
  href: string | null | undefined,
): href is string {
  if (!href) return false
  if (!href.startsWith("/")) return false
  if (href.startsWith("//")) return false
  if (href.includes(":")) return false
  return true
}

export function uniqueInternalPrefetchHrefs(
  hrefs: readonly (string | null | undefined)[],
) {
  return Array.from(new Set(hrefs.filter(isInternalPrefetchHref)))
}
