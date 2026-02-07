"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import NotebookPen from "lucide-react/dist/esm/icons/notebook-pen"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import { RailLabel } from "@/components/ui/rail-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackParam } from "@/hooks/use-track-param"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import type { ModuleCard, ModuleGroup } from "@/lib/accelerator/progress"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

type StartBuildingPagerProps = {
  groups: ModuleGroup[]
  showRailControls?: boolean
  embedded?: boolean
}

export function StartBuildingPager({
  groups,
  showRailControls = true,
  embedded = false,
}: StartBuildingPagerProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const displayGroups = useMemo(() => {
    const transformed: ModuleGroup[] = []
    let formationTrack: ModuleGroup | null = null
    let electivesTrack: ModuleGroup | null = null

    for (const group of groups) {
      const normalizedSlug = (group.slug || group.id).trim().toLowerCase()
      const normalizedTitle = group.title.trim().toLowerCase()
      const isFormationSource = normalizedSlug === "electives" || normalizedTitle === "formation"

      if (!isFormationSource) {
        transformed.push(group)
        continue
      }

      const formationModules = group.modules.filter((module) => !isElectiveAddOnModule(module))
      const electiveModules = group.modules.filter((module) => isElectiveAddOnModule(module))

      if (formationModules.length > 0) {
        formationTrack = {
          ...group,
          title: "Formation",
          slug: "formation",
          modules: formationModules,
        }
      }

      if (electiveModules.length > 0) {
        electivesTrack = {
          ...group,
          title: "Electives",
          slug: "electives",
          modules: electiveModules,
        }
      }
    }

    const ordered: ModuleGroup[] = []
    if (formationTrack) ordered.push(formationTrack)
    ordered.push(...transformed)
    if (electivesTrack) ordered.push(electivesTrack)
    return ordered
  }, [groups])

  const trackKeys = useMemo(
    () => displayGroups.map((group) => group.slug || group.id),
    [displayGroups],
  )
  const { selectedKey, setSelectedKey } = useTrackParam({
    keys: trackKeys,
    paramName: "classTrack",
  })

  const activeGroup = useMemo(
    () =>
      displayGroups.find((group) => (group.slug || group.id) === selectedKey) ??
      displayGroups[0] ??
      null,
    [displayGroups, selectedKey],
  )
  const ActiveTrackIcon = getTrackIcon(activeGroup?.slug || activeGroup?.title)
  const filteredModules = useMemo(() => {
    if (!activeGroup) return []
    return activeGroup.modules.filter((module) => module.title !== "AI The Need")
  }, [activeGroup])

  const renderControls = ({ compact = false }: { compact?: boolean } = {}) => (
    <div className={cn(compact ? "space-y-0" : "space-y-[var(--shell-rail-gap,1rem)]")}>
      <div className="space-y-2">
        <RailLabel htmlFor="track-picker" className="sr-only">
          Track
        </RailLabel>
        {isMounted ? (
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger
              id="track-picker"
              aria-label="Track"
              multiline
              className={cn("w-full py-2", compact && "min-h-10")}
            >
              <ActiveTrackIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue placeholder="Select a track" />
            </SelectTrigger>
            <SelectContent>
              {displayGroups.map((group) => {
                const groupKey = group.slug || group.id
                const TrackIcon = getTrackIcon(group.slug || group.title)
                return (
                  <SelectItem
                    key={groupKey}
                    value={groupKey}
                    hideIndicator
                    icon={<TrackIcon className="h-4 w-4" aria-hidden />}
                  >
                    {group.title}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        ) : (
          <div
            className={cn(
              "flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground shadow-xs",
              compact ? "min-h-10" : "h-10",
            )}
          >
            <ActiveTrackIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span>Select a track</span>
          </div>
        )}
      </div>
    </div>
  )
  const showInlineControls = isMounted && (isMobile || !showRailControls)
  const showRailControlsDesktop = isMounted && !isMobile && showRailControls

  return (
    <div className={cn(embedded ? "space-y-4" : "space-y-5")}>
      {showRailControlsDesktop ? <RightRailSlot priority={0}>{renderControls()}</RightRailSlot> : null}

      {activeGroup ? (
        <section key={activeGroup.id} className={cn(embedded ? "space-y-2.5" : "space-y-3")}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className={cn("font-semibold text-foreground", embedded ? "text-sm" : "text-base")}>
                {activeGroup.title}
              </h3>
              {activeGroup.description ? (
                <p className="text-xs text-muted-foreground">{activeGroup.description}</p>
              ) : null}
            </div>
            {showInlineControls ? (
              <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[240px]">{renderControls({ compact: true })}</div>
            ) : null}
          </div>

          {filteredModules.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredModules.map((module) => (
                <StartBuildingCard
                  key={module.id}
                  module={module}
                  onPrefetch={router.prefetch}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
              No modules available yet.
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}

function StartBuildingCard({
  module,
  onPrefetch,
}: {
  module: ModuleCard
  onPrefetch: (href: string) => void
}) {
  const inProgress = module.status === "in_progress"
  const completed = module.status === "completed"

  const statusLabel = completed ? "Completed" : inProgress ? "In progress" : "Not started"
  const ctaLabel = completed ? "Review" : inProgress ? "Continue" : "Start"

  const cardBody = (
    <>
      <div className="relative aspect-[5/3] overflow-hidden rounded-[22px] shadow-sm mx-[5px] mt-[5px] mb-3">
        <NewsGradientThumb seed={`module-${module.id}`} className="absolute inset-0" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
          Module {module.index}
        </span>
      </div>

      <div className="mt-0.5 space-y-2 px-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase text-muted-foreground">{ctaLabel}</p>
          <div className="flex items-center gap-1.5">
            {module.hasNotes ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <NotebookPen className="h-3.5 w-3.5" aria-hidden />
                <span>Notes</span>
              </span>
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
                "border-border/60 bg-background/70",
                inProgress && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                completed && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {completed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
              <span>{statusLabel}</span>
            </span>
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">{module.title}</p>
        {module.description ? (
          <p className="text-xs text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
            {module.description}
          </p>
        ) : null}
      </div>
    </>
  )

  return (
    <Link
      href={module.href}
      onMouseEnter={() => onPrefetch(module.href)}
      onFocus={() => onPrefetch(module.href)}
      className={cn(
        "group flex min-h-[220px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card text-left shadow-sm transition-transform duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      {cardBody}
    </Link>
  )
}
