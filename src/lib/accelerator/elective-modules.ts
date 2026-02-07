export const ELECTIVE_ADD_ON_MODULES = [
  {
    slug: "retention-and-security",
    title: "Retention and Security",
  },
  {
    slug: "due-diligence",
    title: "Due Diligence",
  },
  {
    slug: "financial-handbook",
    title: "Financial Handbook",
  },
] as const

const ELECTIVE_ADD_ON_MODULE_TITLES = new Set(
  ELECTIVE_ADD_ON_MODULES.map((module) => module.title.trim().toLowerCase()),
)
const ELECTIVE_ADD_ON_MODULE_SLUGS = new Set(
  ELECTIVE_ADD_ON_MODULES.map((module) => module.slug.trim().toLowerCase()),
)

export type ElectiveAddOnModuleSlug = (typeof ELECTIVE_ADD_ON_MODULES)[number]["slug"]

export function getElectiveAddOnModuleSlugs() {
  return ELECTIVE_ADD_ON_MODULES.map((module) => module.slug)
}

export function isElectiveAddOnModuleTitle(title: string) {
  return ELECTIVE_ADD_ON_MODULE_TITLES.has(title.trim().toLowerCase())
}

export function isElectiveAddOnModuleSlug(slug: string): slug is ElectiveAddOnModuleSlug {
  const normalized = slug.trim().toLowerCase()
  return ELECTIVE_ADD_ON_MODULE_SLUGS.has(normalized)
}

export function isElectiveAddOnModule(module: { slug?: string | null; title?: string | null }) {
  const slug = module.slug?.trim().toLowerCase()
  if (slug && ELECTIVE_ADD_ON_MODULE_SLUGS.has(slug)) {
    return true
  }
  const title = module.title?.trim().toLowerCase()
  if (title && ELECTIVE_ADD_ON_MODULE_TITLES.has(title)) {
    return true
  }
  return false
}
