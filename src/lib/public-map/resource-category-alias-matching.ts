function normalizeCategorySearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function publicMapTextContainsCategoryAlias({
  alias,
  text,
}: {
  alias: string
  text: string
}) {
  const normalizedAlias = normalizeCategorySearchText(alias)
  const normalizedText = normalizeCategorySearchText(text)
  if (!normalizedAlias || !normalizedText) return false

  return ` ${normalizedText} `.includes(` ${normalizedAlias} `)
}
