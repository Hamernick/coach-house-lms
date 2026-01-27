"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"


import { RailLabel } from "@/components/ui/rail-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTrackParam } from "@/hooks/use-track-param"
import type { SidebarClass } from "@/lib/academy"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"
import { ModuleStepper, type StepItem, type StepStatus } from "./module-stepper"

const LEGACY_CLASS_TITLES = new Set(["published class"])
const LEGACY_CLASS_SLUGS = new Set(["published-class"])

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
  priorCompleted,
}: {
  activeIndex: number | null
  moduleIndex: number
  isAdmin: boolean
  isCompleted: boolean
  priorCompleted: boolean
}): StepStatus {
  if (isAdmin) {
    if (isCompleted) return "complete"
    if (activeIndex === moduleIndex) return "in_progress"
    if (moduleIndex < (activeIndex ?? 1)) return "complete"
    return "not_started"
  }

  if (isCompleted) return "complete"
  if (!priorCompleted) return "locked"
  if (activeIndex === moduleIndex) return "in_progress"
  return "not_started"
}

function getClassKey(klass: SidebarClass) {
  return klass.slug || klass.id
}

function getActiveClassKey({
  classes,
  pathname,
  basePath,
}: {
  classes: SidebarClass[]
  pathname: string
  basePath: string
}) {
  for (const klass of classes) {
    if (!klass.slug) continue
    const classHref = `${basePath}/class/${klass.slug}`
    if (pathname === classHref || pathname.startsWith(`${classHref}/`)) {
      return getClassKey(klass)
    }
  }
  return null
}

export type ClassesSectionProps = {
  classes?: SidebarClass[]
  isAdmin: boolean
  basePath?: string
  alignHeader?: boolean
  hasAcceleratorAccess?: boolean
  formationStatus?: string | null
}

export function ClassesSection({
  classes = [],
  isAdmin,
  basePath,
  alignHeader = false,
  hasAcceleratorAccess = false,
  formationStatus = null,
}: ClassesSectionProps) {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const normalizedBase = basePath?.replace(/\/$/, "") ?? ""
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const visibleClasses = useMemo(() => {
    const base = classes
      .filter((klass) => klass.published && !isLegacyClass(klass))
      .map((klass) => (klass.slug === "electives" ? { ...klass, title: "Formation" } : klass))
    base.sort((a, b) => {
      if (a.slug === "electives") return -1
      if (b.slug === "electives") return 1
      const pa = typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER
      const pb = typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER
      return pa - pb
    })
    return base
  }, [classes])

  const activeKey = useMemo(
    () => getActiveClassKey({ classes: visibleClasses, pathname, basePath: normalizedBase }),
    [normalizedBase, pathname, visibleClasses],
  )
  const trackKeys = useMemo(() => visibleClasses.map((klass) => getClassKey(klass)), [visibleClasses])
  const formationKey = useMemo(
    () => visibleClasses.find((klass) => klass.slug === "electives")?.slug ?? null,
    [visibleClasses],
  )
  const fallbackKey = activeKey ?? (formationStatus === "pre_501c3" ? formationKey : activeKey)
  const { selectedKey, setSelectedKey } = useTrackParam({ keys: trackKeys, fallbackKey })

  const selectedClass =
    visibleClasses.find((klass) => getClassKey(klass) === selectedKey) ?? visibleClasses[0] ?? null
  const SelectedTrackIcon = getTrackIcon(selectedClass?.slug || selectedClass?.title)

  const modules = useMemo(
    () => (selectedClass?.modules.filter((module) => module.published) ?? []),
    [selectedClass],
  )
  const activeModulePosition =
    selectedClass
      ? modules.findIndex(
          (module) => `${normalizedBase}/class/${selectedClass.slug}/module/${module.index}` === pathname,
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
    if (!selectedClass) return []
    const classLockedByPlan = !isAdmin && !hasAcceleratorAccess && selectedClass.slug !== "electives"
    let priorCompleted = true
    return modules.map((module) => {
      const moduleHref = `${normalizedBase}/class/${selectedClass.slug}/module/${module.index}`
      const isCompleted = completedMap.get(module.id) === true
      const status = deriveModuleStatus({
        activeIndex: activeIdx,
        moduleIndex: module.index,
        isAdmin,
        isCompleted,
        priorCompleted: priorCompleted && !classLockedByPlan,
      })
      const finalStatus = classLockedByPlan ? ("locked" as StepStatus) : status
      if (!isCompleted) {
        priorCompleted = false
      }
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

  if (visibleClasses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-xs text-muted-foreground">
        {isAdmin ? "No published sessions yet." : "No accelerator sessions yet."}
      </div>
    )
  }

  if (!selectedClass) {
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
              <SelectValue
                placeholder="Select a track"
                className="min-w-0 flex-1 text-left text-sm font-medium text-foreground"
              />
            </SelectTrigger>
            <SelectContent>
              {visibleClasses.map((klass) => {
                const key = getClassKey(klass)
                const TrackIcon = getTrackIcon(klass.slug || klass.title)
                return (
                  <SelectItem
                    key={key}
                    value={key}
                    hideIndicator
                    icon={<TrackIcon className="h-4 w-4" aria-hidden />}
                    className="gap-3 py-2"
                  >
                    {formatClassTitle(klass.title)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground shadow-xs">
            {formatClassTitle(selectedClass.title)}
          </div>
        )}
        {!hasAcceleratorAccess && selectedClass.slug !== "electives" ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Unlock this track with Accelerator.</span>
            <Link
              href="/pricing?plan=accelerator"
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
