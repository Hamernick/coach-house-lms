"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import Lock from "lucide-react/dist/esm/icons/lock"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { RightRailSlot } from "@/components/app-shell/right-rail"
import { RailLabel } from "@/components/ui/rail-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackParam } from "@/hooks/use-track-param"
import type { ModuleCard, ModuleGroup } from "@/lib/accelerator/progress"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

type StartBuildingPagerProps = {
  groups: ModuleGroup[]
  showRailControls?: boolean
}

export function StartBuildingPager({ groups, showRailControls = true }: StartBuildingPagerProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const trackKeys = useMemo(
    () => groups.map((group) => group.slug || group.id),
    [groups],
  )
  const { selectedKey, setSelectedKey } = useTrackParam({ keys: trackKeys })

  const activeGroup = useMemo(
    () => groups.find((group) => (group.slug || group.id) === selectedKey) ?? groups[0],
    [groups, selectedKey],
  )
  const ActiveTrackIcon = getTrackIcon(activeGroup?.slug || activeGroup?.title)
  const filteredModules = useMemo(() => {
    if (!activeGroup) return []
    return activeGroup.modules.filter((module) => module.title !== "AI The Need")
  }, [activeGroup])

  const controls = (
    <div className="space-y-[var(--shell-rail-gap,1rem)]">
      <div className="space-y-2">
        <RailLabel htmlFor="module-track">Track</RailLabel>
        {isMounted ? (
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger id="module-track" className="h-10 w-full">
              <ActiveTrackIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <SelectValue placeholder="Select a track" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => {
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
          <div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground shadow-xs">
            <ActiveTrackIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span>Select a track</span>
          </div>
        )}
      </div>
    </div>
  )
  const showInlineControls = isMounted && isMobile
  const showRailControlsDesktop = isMounted && !isMobile && showRailControls

  return (
    <div className="space-y-5">
      {showInlineControls ? <div className="max-w-sm">{controls}</div> : null}
      {showRailControlsDesktop ? <RightRailSlot priority={0}>{controls}</RightRailSlot> : null}

      {activeGroup ? (
        <section key={activeGroup.id} className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">{activeGroup.title}</h3>
              {activeGroup.description ? (
                <p className="text-xs text-muted-foreground">{activeGroup.description}</p>
              ) : null}
            </div>
          </div>

          {filteredModules.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  const locked = module.status === "locked"
  const inProgress = module.status === "in_progress"
  const completed = module.status === "completed"

  const statusLabel = locked ? "Locked" : completed ? "Completed" : inProgress ? "In progress" : "Not started"
  const ctaLabel = locked ? "Locked" : completed ? "Review" : inProgress ? "Continue" : "Start"

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
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
              "border-border/60 bg-background/70",
              inProgress && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              completed && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
            {completed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
            <span>{statusLabel}</span>
          </span>
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

  if (locked) {
    return (
      <div
        aria-disabled
        className={cn(
          "group flex min-h-[220px] flex-col overflow-hidden rounded-[26px] border border-border/60 bg-card text-left shadow-sm",
          "cursor-not-allowed opacity-70",
        )}
      >
        {cardBody}
      </div>
    )
  }

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
