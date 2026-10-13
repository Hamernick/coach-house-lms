import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import type { SidebarClass } from "@/lib/academy"

import { type StepStatus } from "./module-stepper"

const LEGACY_CLASS_TITLES = new Set(["published class"])
const LEGACY_CLASS_SLUGS = new Set(["published-class"])

export type SidebarTrack = SidebarClass & {
  trackKey: string
  routeSlug: string
  displayTitle: string
  lockState: "open" | "requires_paid"
}

function isLegacyClass(klass: SidebarClass): boolean {
  const title = klass.title.trim().toLowerCase()
  const slug = klass.slug.trim().toLowerCase()
  return LEGACY_CLASS_TITLES.has(title) || LEGACY_CLASS_SLUGS.has(slug)
}

function formatClassTitle(title: string) {
  const match = title.match(/^Session\s+[A-Za-z]\d+\s*[–-]\s*(.+)$/i)
  if (match) return match[1].trim()
  return title
}

function getClassKey(klass: SidebarClass) {
  return klass.slug || klass.id
}

export function deriveModuleStatus({
  activeIndex,
  moduleIndex,
  isAdmin,
  isCompleted,
}: {
  activeIndex: number | null
  moduleIndex: number
  isAdmin: boolean
  isCompleted: boolean
}): StepStatus {
  if (isAdmin) {
    if (isCompleted) return "complete"
    if (activeIndex === moduleIndex) return "in_progress"
    if (moduleIndex < (activeIndex ?? 1)) return "complete"
    return "not_started"
  }

  if (isCompleted) return "complete"
  if (activeIndex === moduleIndex) return "in_progress"
  return "not_started"
}

export function getActiveTrackKey({
  tracks,
  pathname,
  basePath,
}: {
  tracks: SidebarTrack[]
  pathname: string
  basePath: string
}) {
  for (const track of tracks) {
    const classHref = `${basePath}/class/${track.routeSlug}`
    if (pathname === classHref || pathname.startsWith(`${classHref}/`)) {
      const marker = `${classHref}/module/`
      if (pathname.startsWith(marker)) {
        const nextPart = pathname.slice(marker.length).split("/")[0]
        const moduleIndex = Number.parseInt(nextPart ?? "", 10)
        if (Number.isFinite(moduleIndex) && track.modules.some((module) => module.index === moduleIndex)) {
          return track.trackKey
        }
      }
      return track.trackKey
    }
  }
  return null
}

export function buildVisibleTracks(classes: SidebarClass[]) {
  const baseClasses = classes
    .filter((klass) => klass.published && !isLegacyClass(klass))
    .sort((a, b) => {
      if (a.slug === "electives") return -1
      if (b.slug === "electives") return 1
      const pa = typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER
      const pb = typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER
      return pa - pb
    })

  const tracks: SidebarTrack[] = []
  for (const klass of baseClasses) {
    if (klass.slug !== "electives") {
      tracks.push({
        ...klass,
        trackKey: getClassKey(klass),
        routeSlug: klass.slug,
        displayTitle: formatClassTitle(klass.title),
        lockState: "requires_paid",
      })
      continue
    }

    const formationModules = klass.modules.filter((module) => !isElectiveAddOnModule(module))
    const electiveModules = klass.modules.filter((module) => isElectiveAddOnModule(module))

    tracks.push({
      ...klass,
      title: "Formation",
      modules: formationModules,
      trackKey: "formation",
      routeSlug: klass.slug,
      displayTitle: "Formation",
      lockState: "open",
    })

    if (electiveModules.length > 0) {
      tracks.push({
        ...klass,
        title: "Electives",
        modules: electiveModules,
        trackKey: "electives",
        routeSlug: klass.slug,
        displayTitle: "Electives",
        lockState: "requires_paid",
      })
    }
  }

  return tracks
}
