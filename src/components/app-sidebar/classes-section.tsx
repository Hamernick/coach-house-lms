"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { RailLabel } from "@/components/ui/rail-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTrackParam } from "@/hooks/use-track-param"
import type { SidebarClass } from "@/lib/academy"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"
import { ModuleStepper, type StepItem, type StepStatus } from "./module-stepper"

const LEGACY_CLASS_TITLES = new Set(["published class"])
const LEGACY_CLASS_SLUGS = new Set(["published-class"])
type SidebarTrack = SidebarClass & {
  trackKey: string
  routeSlug: string
  displayTitle: string
  lockState: "open" | "requires_accelerator" | "requires_elective"
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

function deriveModuleStatus({
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

function getClassKey(klass: SidebarClass) {
  return klass.slug || klass.id
}

function getActiveTrackKey({
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

function buildVisibleTracks(classes: SidebarClass[]) {
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
        lockState: "requires_accelerator",
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
        lockState: "requires_elective",
      })
    }
  }

  return tracks
}

export type ClassesSectionProps = {
  classes?: SidebarClass[]
  isAdmin: boolean
  basePath?: string
  alignHeader?: boolean
  hasAcceleratorAccess?: boolean
  hasElectiveAccess?: boolean
  ownedElectiveModuleSlugs?: string[]
  formationStatus?: string | null
}

export function ClassesSection({
  classes = [],
  isAdmin,
  basePath,
  alignHeader = false,
  hasAcceleratorAccess = false,
  hasElectiveAccess = false,
  ownedElectiveModuleSlugs = [],
  formationStatus = null,
}: ClassesSectionProps) {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const normalizedBase = basePath?.replace(/\/$/, "") ?? ""
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const visibleTracks = useMemo(() => buildVisibleTracks(classes), [classes])
  const ownedElectiveModuleSlugSet = useMemo(
    () => new Set(ownedElectiveModuleSlugs.map((slug) => slug.trim().toLowerCase())),
    [ownedElectiveModuleSlugs],
  )
  const canAccessElectives = hasAcceleratorAccess || hasElectiveAccess

  const activeKey = useMemo(
    () => getActiveTrackKey({ tracks: visibleTracks, pathname, basePath: normalizedBase }),
    [normalizedBase, pathname, visibleTracks],
  )
  const trackKeys = useMemo(() => visibleTracks.map((track) => track.trackKey), [visibleTracks])
  const formationKey = useMemo(
    () => visibleTracks.find((track) => track.trackKey === "formation")?.trackKey ?? null,
    [visibleTracks],
  )
  const fallbackKey = activeKey ?? (formationStatus === "pre_501c3" ? formationKey : activeKey)
  const { selectedKey, setSelectedKey } = useTrackParam({
    keys: trackKeys,
    fallbackKey,
    paramName: "classTrack",
  })

  const selectedTrack = visibleTracks.find((track) => track.trackKey === selectedKey) ?? visibleTracks[0] ?? null
  const SelectedTrackIcon = getTrackIcon(selectedTrack?.trackKey || selectedTrack?.displayTitle)

  const modules = useMemo(
    () => (selectedTrack?.modules.filter((module) => module.published) ?? []),
    [selectedTrack],
  )
  const activeModulePosition =
    selectedTrack
      ? modules.findIndex(
          (module) => `${normalizedBase}/class/${selectedTrack.routeSlug}/module/${module.index}` === pathname,
        )
      : -1
  const activeIdx = activeModulePosition >= 0 ? modules[activeModulePosition]?.index ?? null : null
  const completedMap = new Map<string, boolean>()
  if (typeof window !== "undefined") {
    modules.forEach((module) => {
      try {
        const val = window.sessionStorage.getItem(`module-complete-${module.id}`)
        completedMap.set(module.id, val === "true")
      } catch {
        completedMap.set(module.id, false)
      }
    })
  }
  const steps: StepItem[] = (() => {
    if (!selectedTrack) return []
    const classLockedByPlan = !isAdmin &&
      ((selectedTrack.lockState === "requires_accelerator" && !hasAcceleratorAccess) ||
        (selectedTrack.lockState === "requires_elective" && !canAccessElectives))
    return modules.map((module) => {
      const moduleHref = `${normalizedBase}/class/${selectedTrack.routeSlug}/module/${module.index}`
      const isCompleted = completedMap.get(module.id) === true
      const moduleLockedByElective =
        !isAdmin &&
        !hasAcceleratorAccess &&
        selectedTrack.trackKey === "electives" &&
        isElectiveAddOnModule(module) &&
        !ownedElectiveModuleSlugSet.has((module.slug ?? "").trim().toLowerCase())
      const status = deriveModuleStatus({
        activeIndex: activeIdx,
        moduleIndex: module.index,
        isAdmin,
        isCompleted,
      })
      const finalStatus = classLockedByPlan || moduleLockedByElective ? ("not_started" as StepStatus) : status
      return {
        id: module.id,
        href: moduleHref,
        title: module.title,
        status: finalStatus,
        active: pathname === moduleHref,
      }
    })
  })()

  if (classes.length === 0) {
    return null
  }

  if (visibleTracks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-xs text-muted-foreground">
        {isAdmin ? "No published sessions yet." : "No accelerator sessions yet."}
      </div>
    )
  }

  if (!selectedTrack) {
    return null
  }

  return (
    <div className="space-y-[var(--shell-rail-gap,1rem)]">
      <div className={cn("space-y-2", alignHeader && "pt-2")}>
        <RailLabel htmlFor="track-picker" className="sr-only">
          Track
        </RailLabel>
        {isMounted ? (
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger id="track-picker" multiline className="w-full py-2">
              <SelectedTrackIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue placeholder="Select a track" className="min-w-0 flex-1 text-left text-sm font-medium text-foreground" />
            </SelectTrigger>
            <SelectContent>
              {visibleTracks.map((track) => {
                const TrackIcon = getTrackIcon(track.trackKey || track.displayTitle)
                return (
                  <SelectItem
                    key={track.trackKey}
                    value={track.trackKey}
                    hideIndicator
                    icon={<TrackIcon className="h-4 w-4" aria-hidden />}
                    className="gap-3 py-2"
                  >
                    {track.displayTitle}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground shadow-xs">
            {selectedTrack.displayTitle}
          </div>
        )}
        {!canAccessElectives && selectedTrack.trackKey === "electives" ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Electives are optional add-ons.</span>
            <Link
              href="/my-organization?paywall=elective&plan=electives&source=sidebar"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Unlock
            </Link>
          </div>
        ) : null}
        {canAccessElectives &&
        !hasAcceleratorAccess &&
        selectedTrack.trackKey === "electives" &&
        ownedElectiveModuleSlugSet.size < modules.length ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Some electives are not included yet.</span>
            <Link
              href="/my-organization?paywall=elective&plan=electives&source=sidebar"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Buy more
            </Link>
          </div>
        ) : null}
        {!hasAcceleratorAccess && selectedTrack.lockState === "requires_accelerator" && selectedTrack.trackKey !== "electives" ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Unlock this track with Accelerator.</span>
            <Link
              href="/my-organization?paywall=accelerator&plan=accelerator&source=sidebar"
              className="text-foreground underline-offset-4 hover:underline"
            >
              View plans
            </Link>
          </div>
        ) : null}
      </div>

      {modules.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-2 pl-3">
            <ModuleStepper steps={steps} onHover={(href) => router.prefetch(href)} />
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-xs text-muted-foreground">
          No modules available yet.
        </div>
      )}
    </div>
  )
}
