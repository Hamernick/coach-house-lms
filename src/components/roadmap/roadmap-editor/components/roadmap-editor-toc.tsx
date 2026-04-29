import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import type { RefObject } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"

import type { RoadmapDraft, RoadmapTocItem } from "../types"

function RoadmapTocStatusDot({
  status,
}: {
  status: RoadmapSectionStatus
}) {
  const statusClass =
    status === "complete"
      ? "bg-emerald-500"
      : status === "in_progress"
        ? "bg-amber-500"
        : "bg-border"

  return (
    <span
      aria-hidden
      className={cn("h-2 w-2 shrink-0 rounded-full", statusClass)}
    />
  )
}

type RoadmapEditorTocProps = {
  tocItems: RoadmapTocItem[]
  activeSectionId: string
  drafts: Record<string, RoadmapDraft>
  openGroups: Record<string, boolean>
  tocIndicator: { top: number; height: number; visible: boolean }
  sectionsListRef: RefObject<HTMLDivElement | null>
  onSectionSelect: (next: { id: string; slug: string }) => void
  onToggleGroup: (groupId: string) => void
  isFrameworkSection: (section: RoadmapSection) => boolean
  resolveSectionStatus: (
    section: RoadmapSection,
    draft?: RoadmapDraft | null,
  ) => RoadmapSectionStatus
  collapsed?: boolean
  onCollapsedChange?: (next: boolean) => void
}

export function RoadmapEditorToc({
  tocItems,
  activeSectionId,
  drafts,
  openGroups,
  tocIndicator,
  sectionsListRef,
  onSectionSelect,
  onToggleGroup,
  isFrameworkSection,
  resolveSectionStatus,
  collapsed = false,
  onCollapsedChange,
}: RoadmapEditorTocProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {onCollapsedChange ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto w-full justify-between rounded-lg px-1 py-1 text-left hover:bg-muted/30"
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <WaypointsIcon className="h-4 w-4" aria-hidden />
              Strategic Roadmap
            </span>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                collapsed && "-rotate-90",
              )}
              aria-hidden
            />
          </Button>
        ) : (
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <WaypointsIcon className="h-4 w-4" aria-hidden />
            Strategic Roadmap
          </p>
        )}
      </div>
      {collapsed ? null : (
        <div
          ref={sectionsListRef}
          id="roadmap-section-picker-trigger"
          className="relative w-full min-w-0 space-y-1.5 pl-4 pr-2 text-sm"
        >
          <span
            aria-hidden
            className="absolute left-1 top-0 h-full w-px rounded-full bg-border/60"
          />
          <span
            aria-hidden
            className={cn(
              "absolute left-1 w-[2px] rounded-full bg-foreground/90 transition-[transform,height,opacity] duration-200 ease-out motion-reduce:transition-none",
              tocIndicator.visible ? "opacity-100" : "opacity-0",
            )}
            style={{
              height: `${tocIndicator.height}px`,
              transform: `translateY(${tocIndicator.top}px)`,
            }}
          />
          {tocItems.map((item) => {
          if (item.type === "group") {
            const groupOpen = openGroups[item.section.id] ?? true
            const isActive = item.section.id === activeSectionId
            const draft = drafts[item.section.id]
            const draftTitle = draft?.title?.trim()
            const displayTitle = isFrameworkSection(item.section)
              ? item.section.templateTitle
              : draftTitle || item.section.title?.trim() || ""
            const itemStatus = resolveSectionStatus(item.section, draft)
            return (
              <div key={item.section.id} className="space-y-1 snap-start snap-always">
                <div className="group flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-toc-item
                    data-active={isActive}
                    data-toc-id={item.section.id}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "h-auto min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() =>
                      onSectionSelect({ id: item.section.id, slug: item.section.slug })
                    }
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <RoadmapTocStatusDot status={itemStatus} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {displayTitle}
                      </span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-md text-muted-foreground transition hover:text-foreground",
                      groupOpen && "text-foreground",
                    )}
                    aria-label={
                      groupOpen ? "Collapse section group" : "Expand section group"
                    }
                    aria-expanded={groupOpen}
                    onClick={() => onToggleGroup(item.section.id)}
                  >
                    <ChevronDownIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        groupOpen ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </Button>
                </div>
                {groupOpen
                  ? item.children.map((child) => {
                      const childIsActive = child.id === activeSectionId
                      const childDraft = drafts[child.id]
                      const childTitle = childDraft?.title?.trim()
                      const childDisplayTitle = isFrameworkSection(child)
                        ? child.templateTitle
                        : childTitle || child.title?.trim() || ""
                      const childStatus = resolveSectionStatus(child, childDraft)
                      return (
                        <div
                          key={child.id}
                          className="group flex items-center gap-2 snap-start snap-always"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-toc-item
                            data-active={childIsActive}
                            data-toc-id={child.id}
                            aria-current={childIsActive ? "page" : undefined}
                            className={cn(
                              "h-auto min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 pl-6 text-left transition-colors",
                              childIsActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() =>
                              onSectionSelect({ id: child.id, slug: child.slug })
                            }
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <RoadmapTocStatusDot status={childStatus} />
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                                {childDisplayTitle}
                              </span>
                            </span>
                          </Button>
                        </div>
                      )
                    })
                  : null}
              </div>
            )
          }

          const isActive = item.section.id === activeSectionId
          const draft = drafts[item.section.id]
          const draftTitle = draft?.title?.trim()
          const displayTitle = isFrameworkSection(item.section)
            ? item.section.templateTitle
            : draftTitle || item.section.title?.trim() || ""
          const itemStatus = resolveSectionStatus(item.section, draft)

          return (
            <div key={item.section.id} className="group flex items-center gap-2 snap-start snap-always">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-toc-item
                data-active={isActive}
                data-toc-id={item.section.id}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-auto min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() =>
                  onSectionSelect({ id: item.section.id, slug: item.section.slug })
                }
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <RoadmapTocStatusDot status={itemStatus} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayTitle}</span>
                </span>
              </Button>
            </div>
          )
          })}
        </div>
      )}
    </div>
  )
}
