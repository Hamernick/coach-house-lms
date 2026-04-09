"use client"

import { useState, type PointerEvent as ReactPointerEvent } from "react"
import { addDays, differenceInCalendarDays, format } from "date-fns"

import { cn } from "@/lib/utils"

export type MemberWorkspaceProjectTimelineBarItem = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status?: "todo" | "in-progress" | "done"
  progress?: number
}

export function MemberWorkspaceProjectTimelineDraggableBar({
  item,
  variant,
  viewStartDate,
  cellWidth,
  onUpdateStart,
  onUpdateDuration,
  onDoubleClick,
  disabled = false,
}: {
  item: MemberWorkspaceProjectTimelineBarItem
  variant: "project" | "task"
  viewStartDate: Date
  cellWidth: number
  onUpdateStart: (id: string, newStart: Date) => void
  onUpdateDuration?: (id: string, newStart: Date, newEnd: Date) => void
  onDoubleClick?: () => void
  disabled?: boolean
}) {
  const durationDays = differenceInCalendarDays(item.endDate, item.startDate) + 1
  const offsetDays = differenceInCalendarDays(item.startDate, viewStartDate)
  const left = offsetDays * cellWidth
  const width = durationDays * cellWidth

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragType, setDragType] = useState<"move" | "resize-left" | "resize-right" | null>(null)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const nextDragType =
      offsetX < 8 ? "resize-left" : offsetX > rect.width - 8 ? "resize-right" : "move"
    setDragType(nextDragType)

    const startX = event.clientX
    document.body.style.cursor = nextDragType === "move" ? "grabbing" : "col-resize"

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setDragOffset(moveEvent.clientX - startX)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      const deltaX = upEvent.clientX - startX
      const daysMoved = Math.round(deltaX / cellWidth)

      if (daysMoved !== 0) {
        if (nextDragType === "move") {
          onUpdateStart(item.id, addDays(item.startDate, daysMoved))
        } else if (nextDragType === "resize-left" && onUpdateDuration) {
          const newStartDate = addDays(item.startDate, daysMoved)
          if (newStartDate < item.endDate) {
            onUpdateDuration(item.id, newStartDate, item.endDate)
          }
        } else if (nextDragType === "resize-right" && onUpdateDuration) {
          const newEndDate = addDays(item.endDate, daysMoved)
          if (newEndDate > item.startDate) {
            onUpdateDuration(item.id, item.startDate, newEndDate)
          }
        }
      }

      setIsDragging(false)
      setDragOffset(0)
      setDragType(null)
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  let visualLeft = left
  let visualWidth = width

  if (isDragging && dragType) {
    if (dragType === "move") {
      visualLeft = left + dragOffset
    } else if (dragType === "resize-right") {
      visualWidth = Math.max(cellWidth, width + dragOffset)
    } else if (dragType === "resize-left") {
      visualLeft = left + dragOffset
      visualWidth = Math.max(cellWidth, width - dragOffset)
    }
  }

  const dateLabel = `${format(item.startDate, "d/M")} - ${format(item.endDate, "d/M")}`
  const taskColors =
    item.status === "done"
      ? "bg-teal-500/15 border-teal-500/40 text-teal-600"
      : item.status === "in-progress"
        ? "bg-primary/10 border-primary/30 text-blue-800"
        : "bg-primary/10 border-primary/30 text-primary"

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      className={cn(
        "absolute top-[12px] flex h-[30px] select-none items-center gap-2 overflow-hidden rounded-md border px-2",
        disabled ? "cursor-default" : "group cursor-grab active:cursor-grabbing",
        variant === "project" ? "border-border bg-muted text-foreground" : taskColors,
        isDragging && "z-30 shadow-lg opacity-90",
      )}
      style={{
        left: `${visualLeft}px`,
        width: `${Math.max(visualWidth, 50)}px`,
        transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      {!disabled ? (
        <>
          <div className="absolute inset-y-0 left-0 w-2 cursor-col-resize rounded-l-md bg-white/30 opacity-0 group-hover:opacity-100" />
          <div className="absolute inset-y-0 right-0 w-2 cursor-col-resize rounded-r-md bg-white/30 opacity-0 group-hover:opacity-100" />
        </>
      ) : null}

      {variant === "task" ? <div className="h-4 w-0.5 shrink-0 rounded-full bg-current/50" /> : null}
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium tracking-[0.0923px]">
        {dateLabel}: {item.name}
      </span>
      {variant === "task" ? <div className="ml-auto h-4 w-0.5 shrink-0 rounded-full bg-current/50" /> : null}
    </div>
  )
}
