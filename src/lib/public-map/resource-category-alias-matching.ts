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

// A category scan checks hundreds of aliases against the same narrative.
// Normalize that narrative once, without retaining user text in a global cache.
export function createPublicMapCategoryAliasMatcher(text: string) {
  const normalizedText = normalizeCategorySearchText(text)
  const paddedText = ` ${normalizedText} `

  return (alias: string) => {
    const normalizedAlias = normalizeCategorySearchText(alias)
    if (!normalizedAlias || !normalizedText) return false
    return paddedText.includes(` ${normalizedAlias} `)
  }
}

export function publicMapTextContainsCategoryAlias({
  alias,
  text,
}: {
  alias: string
  text: string
}) {
  return createPublicMapCategoryAliasMatcher(text)(alias)
}
