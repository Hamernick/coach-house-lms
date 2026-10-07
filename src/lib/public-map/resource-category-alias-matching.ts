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

export const PUBLIC_MAP_RESOURCE_LEGACY_CATEGORY_KEYS = {
  community_resource: "community",
  dental: "health_dental",
  education_resource: "education",
  funding: "finance",
  jobs: "employment",
  legal_benefits: "legal",
  medical: "health",
  mental_health: "health_mental_health",
  online_media: "community_internet_access",
  shelter: "housing_emergency_shelter",
  transportation: "community_transportation",
  water: "food_water",
  womens_health: "health_womens_health",
} as const
