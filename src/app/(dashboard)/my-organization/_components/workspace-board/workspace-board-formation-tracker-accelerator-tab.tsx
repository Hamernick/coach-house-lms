"use client"

import Link from "next/link"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"

import { cn } from "@/lib/utils"

import { TrackerRowAction, TrackerSectionHeader } from "./workspace-board-formation-tracker-card-ui"
import type { WorkspaceSeedData, WorkspaceTrackerState } from "./workspace-board-types"

export type AcceleratorGroup = {
  id: string
  title: string
  modules: WorkspaceSeedData["formationSummary"]["visibleModules"]
}

export function TrackerAcceleratorTab({
  presentationMode,
  tracker,
  collapsedSections,
  groups,
  maxVisibleModulesPerGroup,
  onToggleSection,
  onToggleGroupArchive,
}: {
  presentationMode: boolean
  tracker: WorkspaceTrackerState
  collapsedSections: Record<string, boolean>
  groups: AcceleratorGroup[]
  maxVisibleModulesPerGroup: number
  onToggleSection: (sectionId: string) => void
  onToggleGroupArchive: (groupId: string) => void
}) {
  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Accelerator modules will appear as soon as your roadmap is available.
      </p>
    )
  }

  return (
    <div className="space-y-1.5 pb-1">
      {groups.map((group) => {
        const sectionId = `accelerator-${group.id}`
        const isCollapsed = collapsedSections[sectionId] === true
        const isArchived = tracker.archivedAcceleratorGroups.includes(group.id)
        const openModules = group.modules.filter((module) => module.status !== "completed")
        const visibleModules = openModules.slice(0, maxVisibleModulesPerGroup)
        const hiddenCount = Math.max(0, openModules.length - visibleModules.length)

        return (
          <div key={group.id} className="rounded-lg border border-border/60 bg-background/50 px-2 py-1.5">
            <TrackerSectionHeader
              collapsed={isCollapsed}
              title={group.title}
              count={openModules.length}
              onToggle={() => onToggleSection(sectionId)}
              actionLabel={isArchived ? `Restore ${group.title}` : `Archive ${group.title}`}
              onAction={() => onToggleGroupArchive(group.id)}
              actionIcon={isArchived ? "restore" : "archive"}
            />

            {!isCollapsed ? (
              <div className={cn("space-y-1 border-t border-border/50 pt-1.5", isArchived && "opacity-55")}>
                {isArchived ? (
                  <p className="px-0.5 text-[11px] text-muted-foreground">
                    Archived. Restore to surface this track.
                  </p>
                ) : openModules.length === 0 ? (
                  <p className="px-0.5 text-[11px] text-muted-foreground">
                    All modules complete.
                  </p>
                ) : (
                  <>
                    {visibleModules.map((module) => {
                      const markerClassName = cn(
                        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold tabular-nums",
                        module.status === "completed"
                          ? "border-foreground bg-foreground text-background"
                          : module.status === "in_progress"
                            ? "border-foreground text-foreground"
                            : "border-border/70 text-foreground/75",
                      )

                      const moduleRow = (
                        <>
                          <span className={markerClassName} aria-hidden>
                            {module.status === "completed" ? (
                              <CheckIcon className="h-2.5 w-2.5" aria-hidden />
                            ) : module.status === "in_progress" ? (
                              <CircleDotIcon className="h-2.5 w-2.5" aria-hidden />
                            ) : (
                              module.index
                            )}
                          </span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              module.status === "completed" && "text-muted-foreground line-through decoration-2",
                            )}
                          >
                            {module.title}
                          </span>
                          <TrackerRowAction status={module.status} label={`Open ${module.title}`} />
                        </>
                      )

                      return presentationMode ? (
                        <div key={module.id} className="flex items-center gap-2 rounded-md px-0.5 py-1">
                          {moduleRow}
                        </div>
                      ) : (
                        <Link
                          key={module.id}
                          href={module.href}
                          className="flex items-center gap-2 rounded-md px-0.5 py-1 transition-colors hover:bg-muted/20"
                        >
                          {moduleRow}
                        </Link>
                      )
                    })}
                    {hiddenCount > 0 ? (
                      <p className="px-0.5 text-[11px] text-muted-foreground tabular-nums">
                        +{hiddenCount} more modules
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
