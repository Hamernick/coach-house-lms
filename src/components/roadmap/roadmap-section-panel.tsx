"use client"

import { useMemo, type ComponentProps, type ComponentType, type RefObject, type CSSProperties, type ReactNode } from "react"

import { RichTextEditor } from "@/components/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RoadmapSectionStatus } from "@/lib/roadmap"

type RichTextEditorProps = ComponentProps<typeof RichTextEditor>

type RoadmapSectionPanelProps = {
  title: string
  subtitle?: string | null
  icon: ComponentType<{ className?: string }>
  status: RoadmapSectionStatus
  canEdit?: boolean
  onStatusChange?: (status: RoadmapSectionStatus) => void
  statusSelectDisabled?: boolean
  isHydrated?: boolean
  showHeader?: boolean
  headerVariant?: "default" | "calendar"
  headerIconSize?: number | null
  headerTextRef?: RefObject<HTMLDivElement | null>
  contentMaxWidth?: string
  toolbarSlotId?: string
  body?: ReactNode
  editorProps?: RichTextEditorProps
}

export function RoadmapSectionPanel({
  title,
  subtitle,
  icon: Icon,
  status,
  canEdit = true,
  onStatusChange,
  statusSelectDisabled = false,
  isHydrated = true,
  showHeader = true,
  headerVariant = "default",
  headerIconSize = null,
  headerTextRef,
  contentMaxWidth = "max-w-3xl",
  toolbarSlotId,
  body,
  editorProps,
}: RoadmapSectionPanelProps) {
  const statusLabel = useMemo(
    () => (status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Not started"),
    [status],
  )
  const statusDotClass = useMemo(
    () => (status === "complete" ? "bg-emerald-500" : status === "in_progress" ? "bg-amber-500" : "bg-border"),
    [status],
  )
  const headerPaddingClass = headerVariant === "calendar" ? "pt-0" : "pt-2 sm:pt-4"
  const headerTextSpacing = headerVariant === "calendar" ? "space-y-0.5" : "space-y-1"

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-6 overflow-hidden">
      {showHeader ? (
        <div className={cn("w-full", headerPaddingClass)}>
          <div
            className={cn(
              "mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
              contentMaxWidth,
            )}
          >
            <div
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-start"
              style={headerIconSize ? ({ "--roadmap-header-icon-size": `${headerIconSize}px` } as CSSProperties) : undefined}
            >
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground shadow-sm sm:h-[var(--roadmap-header-icon-size,3rem)] sm:w-[var(--roadmap-header-icon-size,3rem)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div ref={headerTextRef} className={cn("text-left", headerTextSpacing)}>
                {isHydrated ? (
                  <>
                    {title ? (
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                    ) : null}
                    {subtitle ? (
                      <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Skeleton className="h-7 w-48 rounded-full" />
                    <Skeleton className="h-4 w-72 rounded-full" />
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {!isHydrated ? (
                <Skeleton className="h-7 w-24 rounded-full" />
              ) : canEdit && onStatusChange ? (
                <Select
                  value={status}
                  onValueChange={(value) => onStatusChange(value as RoadmapSectionStatus)}
                  disabled={statusSelectDisabled}
                >
                  <SelectTrigger
                    className="h-7 rounded-full border border-border/60 bg-muted/40 px-2.5 text-xs font-medium text-muted-foreground shadow-none"
                    aria-label="Roadmap section status"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
                      <SelectValue placeholder={statusLabel} />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="flex w-full min-h-0 min-w-0 flex-1">
        <div className={cn("mx-auto flex w-full min-h-0 flex-1 flex-col gap-5", contentMaxWidth)}>
          {toolbarSlotId ? <div id={toolbarSlotId} className="w-full" /> : null}
          {body ?? (editorProps ? <RichTextEditor {...editorProps} /> : null)}
        </div>
      </section>
    </div>
  )
}
