import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"

type AcceleratorOverviewModule = {
  id: string
  slug: string
  title: string
  index: number
  sequence?: number
  href?: string
}

type AcceleratorOverviewGroup<TModule extends AcceleratorOverviewModule> = {
  title: string
  slug: string
  modules: TModule[]
}

export const PROGRAM_TEMPLATES = [
  {
    title: "After-school STEM Lab",
    location: "Youth enrichment",
    chips: ["12-week cohort", "STEM mentors", "Pilot ready"],
    patternId: "template-stem",
  },
  {
    title: "Community Health Navigation",
    location: "Public health",
    chips: ["Case management", "Referral network", "Outcomes plan"],
    patternId: "template-health",
  },
]

export const CORE_ROADMAP_SECTION_IDS = new Set([
  "origin_story",
  "need",
  "mission_vision_values",
  "theory_of_change",
  "program",
])

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function dedupeModulesById<T extends { id: string }>(modules: T[]) {
  const seen = new Set<string>()
  return modules.filter((module) => {
    if (seen.has(module.id)) return false
    seen.add(module.id)
    return true
  })
}

export function buildVisibleAcceleratorGroups<
  TModule extends AcceleratorOverviewModule,
  TGroup extends AcceleratorOverviewGroup<TModule>,
>({
  groups,
  hasAcceleratorAccess,
  ownedElectiveModuleSlugSet,
}: {
  groups: TGroup[]
  hasAcceleratorAccess: boolean
  ownedElectiveModuleSlugSet: Set<string>
}) {
  const baseGroups = groups.filter((group) => {
    const title = group.title.trim().toLowerCase()
    const slug = group.slug.trim().toLowerCase()
    return title !== "published class" && slug !== "published-class"
  })

  const transformed: TGroup[] = []
  let formationTrack: TGroup | null = null
  let electivesTrack: TGroup | null = null

  for (const group of baseGroups) {
    const normalizedSlug = group.slug.trim().toLowerCase()
    const normalizedTitle = group.title.trim().toLowerCase()
    const isFormationSource =
      normalizedSlug === "electives" || normalizedSlug === "formation" || normalizedTitle === "formation"

    if (!isFormationSource) {
      if (hasAcceleratorAccess) {
        transformed.push(group)
      }
      continue
    }

    const formationModules = group.modules.filter((module) => !isElectiveAddOnModule(module))
    const electiveModules = group.modules.filter((module) => isElectiveAddOnModule(module))

    if (formationModules.length > 0) {
      const seed: TGroup =
        formationTrack ??
        ({
          ...group,
          title: "Formation",
          slug: "formation",
          modules: [],
        } satisfies AcceleratorOverviewGroup<TModule> as TGroup)

      formationTrack = {
        ...seed,
        modules: [...seed.modules, ...formationModules],
      }
    }

    const accessibleElectiveModules = hasAcceleratorAccess
      ? electiveModules
      : electiveModules.filter((module) => ownedElectiveModuleSlugSet.has(module.slug.trim().toLowerCase()))

    if (accessibleElectiveModules.length > 0) {
      const seed: TGroup =
        electivesTrack ??
        ({
          ...group,
          title: "Electives",
          slug: "electives",
          modules: [],
        } satisfies AcceleratorOverviewGroup<TModule> as TGroup)

      electivesTrack = {
        ...seed,
        modules: [...seed.modules, ...accessibleElectiveModules],
      }
    }
  }

  if (formationTrack) {
    formationTrack = {
      ...formationTrack,
      modules: sortAcceleratorModules(dedupeModulesById(formationTrack.modules)),
    }
  }

  if (electivesTrack) {
    electivesTrack = {
      ...electivesTrack,
      modules: sortAcceleratorModules(dedupeModulesById(electivesTrack.modules)),
    }
  }

  const ordered: TGroup[] = []
  if (formationTrack) ordered.push(formationTrack)
  ordered.push(...transformed)
  if (electivesTrack) ordered.push(electivesTrack)
  return ordered.filter((group) => group.modules.length > 0)
}
