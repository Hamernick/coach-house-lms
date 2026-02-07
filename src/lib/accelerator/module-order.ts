import { isElectiveAddOnModuleSlug, isElectiveAddOnModuleTitle } from "@/lib/accelerator/elective-modules"

const CORE_FORMATION_MODULE_SLUG_ORDER = ["naming-your-nfp", "nfp-registration", "filing-1023"] as const
const CORE_FORMATION_SLUG_RANK = new Map(
  CORE_FORMATION_MODULE_SLUG_ORDER.map((slug, index) => [slug, index]),
)
const CORE_FORMATION_TITLE_RANK = new Map(
  [
    ["naming your nfp", 0],
    ["nfp registration", 1],
    ["filing 1023", 2],
  ] as const,
)

type OrderedModule = {
  slug: string
  title: string
  index: number
  sequence?: number
  href?: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function normalizeModuleTitle(value: string) {
  return normalize(value).replace(/[\u2019']/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

function classSlugFromHref(href?: string) {
  if (!href) return null
  const match = href.match(/\/class\/([^/]+)\//)
  return match ? normalize(match[1]) : null
}

function resolveCoreFormationRank(module: OrderedModule): number | null {
  const slug = normalize(module.slug)
  const title = normalizeModuleTitle(module.title)
  const bySlug = CORE_FORMATION_SLUG_RANK.get(slug)
  if (bySlug != null) return bySlug

  const byTitle = CORE_FORMATION_TITLE_RANK.get(title)
  if (byTitle != null) return byTitle

  const formationPhrase = `${slug} ${title}`
  if (
    formationPhrase.includes("naming") &&
    (formationPhrase.includes("nfp") || formationPhrase.includes("nonprofit"))
  ) {
    return 0
  }
  if (
    formationPhrase.includes("registration") &&
    (formationPhrase.includes("nfp") || formationPhrase.includes("nonprofit"))
  ) {
    return 1
  }
  if (formationPhrase.includes("1023")) {
    return 2
  }

  const classSlug = classSlugFromHref(module.href)
  const knownElectiveAddOn = isElectiveAddOnModuleSlug(slug) || isElectiveAddOnModuleTitle(module.title)
  if (!knownElectiveAddOn && classSlug === "electives" && module.index >= 4 && module.index <= 6) {
    return module.index - 4
  }

  return null
}

function isElectiveAddOnModule(module: OrderedModule) {
  const slug = normalize(module.slug)
  if (isElectiveAddOnModuleSlug(slug)) return true
  if (isElectiveAddOnModuleTitle(module.title)) return true
  if (resolveCoreFormationRank(module) != null) return false

  const classSlug = classSlugFromHref(module.href)
  return classSlug === "electives" && module.index >= 1 && module.index <= 3
}

function sequenceRank(module: OrderedModule) {
  return Number.isFinite(module.sequence) ? Number(module.sequence) : module.index
}

export function compareAcceleratorModules(a: OrderedModule, b: OrderedModule) {
  const aCoreRank = resolveCoreFormationRank(a)
  const bCoreRank = resolveCoreFormationRank(b)
  if (aCoreRank != null && bCoreRank != null) return aCoreRank - bCoreRank
  if (aCoreRank != null) return -1
  if (bCoreRank != null) return 1

  const aIsElective = isElectiveAddOnModule(a)
  const bIsElective = isElectiveAddOnModule(b)
  if (aIsElective !== bIsElective) return aIsElective ? 1 : -1

  const aSequence = sequenceRank(a)
  const bSequence = sequenceRank(b)
  if (aSequence !== bSequence) return aSequence - bSequence

  return a.title.localeCompare(b.title)
}

export function sortAcceleratorModules<T extends OrderedModule>(modules: T[]): T[] {
  return [...modules].sort(compareAcceleratorModules)
}
