"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import type {
  ColumnSizingState,
  Header,
  Table as ReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { cn } from "@/lib/utils"

const COLUMN_RESIZE_KEYBOARD_STEP = 16
const ROW_RESIZE_KEYBOARD_STEP = 8

export const WORKSPACE_PEOPLE_MIN_ROW_HEIGHT = 40
export const WORKSPACE_PEOPLE_MAX_ROW_HEIGHT = 160

export type WorkspacePeopleTableRowHeight = "compact" | "standard" | "spacious"
export type WorkspacePeopleTableContentMode = "truncate" | "wrap"

export const WORKSPACE_PEOPLE_DEFAULT_ROW_HEIGHTS: Record<
  WorkspacePeopleTableRowHeight,
  number
> = {
  compact: 44,
  standard: 52,
  spacious: 64,
}

export type WorkspacePeopleRowSizing = Record<string, number>

export const WORKSPACE_PEOPLE_DRAWER_COLUMN_DIMENSIONS: Record<
  string,
  {
    size: number
    minSize: number
    maxSize: number
    enableResizing: boolean
  }
> = {
  select: { size: 44, minSize: 44, maxSize: 44, enableResizing: false },
  person: { size: 216, minSize: 176, maxSize: 480, enableResizing: true },
  role: { size: 160, minSize: 112, maxSize: 320, enableResizing: true },
  segments: { size: 200, minSize: 128, maxSize: 400, enableResizing: true },
  tags: { size: 200, minSize: 128, maxSize: 400, enableResizing: true },
  reportsTo: { size: 176, minSize: 128, maxSize: 360, enableResizing: true },
  email: { size: 224, minSize: 160, maxSize: 440, enableResizing: true },
  linkedin: { size: 136, minSize: 112, maxSize: 240, enableResizing: true },
  action: { size: 80, minSize: 72, maxSize: 192, enableResizing: true },
  canvas: { size: 48, minSize: 48, maxSize: 48, enableResizing: false },
}

export function buildWorkspacePeopleColumnSizeVars(
  table: ReactTable<OrgPersonWithImage>,
  columnSizing: ColumnSizingState,
  columnVisibility: VisibilityState
) {
  const resolveColumnSize = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return 0

    const requestedSize = columnSizing[columnId]
    if (requestedSize === undefined) return column.getSize()

    const minSize = column.columnDef.minSize ?? 20
    const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
    return Math.min(maxSize, Math.max(minSize, requestedSize))
  }
  const visibleTableWidth = table
    .getVisibleLeafColumns()
    .reduce(
      (totalWidth, column) => totalWidth + resolveColumnSize(column.id),
      0
    )
  const sizeVars: Record<string, number> = {
    "--workspace-people-table-width": visibleTableWidth,
    "--workspace-people-canvas-offset":
      columnVisibility.canvas === false ? 0 : resolveColumnSize("canvas"),
  }

  table.getFlatHeaders().forEach((header) => {
    if (columnVisibility[header.column.id] === false) return
    const columnSize = resolveColumnSize(header.column.id)
    sizeVars[`--header-${header.id}-size`] = columnSize
    sizeVars[`--col-${header.column.id}-size`] = columnSize
  })

  return sizeVars as CSSProperties
}

export function measureWorkspacePeopleColumnWidth(
  container: HTMLElement,
  columnId: string,
  fallbackWidth: number
) {
  const dimensions = WORKSPACE_PEOPLE_DRAWER_COLUMN_DIMENSIONS[columnId]
  if (!dimensions) return fallbackWidth

  const columnElements = Array.from(
    container.querySelectorAll<HTMLElement>("[data-workspace-people-column]")
  ).filter((element) => element.dataset.workspacePeopleColumn === columnId)

  const measuredWidth = columnElements.reduce((largestWidth, element) => {
    const styles = window.getComputedStyle(element)
    const horizontalPadding =
      Number.parseFloat(styles.paddingLeft) +
      Number.parseFloat(styles.paddingRight)
    const contentWidth = Array.from(element.children).reduce(
      (largestChildWidth, child) => {
        if (child.getAttribute("role") === "separator") {
          return largestChildWidth
        }
        const childElement = child as HTMLElement
        return Math.max(
          largestChildWidth,
          childElement.scrollWidth,
          childElement.getBoundingClientRect().width
        )
      },
      0
    )

    return Math.max(largestWidth, Math.ceil(contentWidth + horizontalPadding))
  }, 0)

  const nextWidth = measuredWidth || fallbackWidth
  return Math.min(dimensions.maxSize, Math.max(dimensions.minSize, nextWidth))
}

export function clampWorkspacePeopleRowHeight(rowHeight: number) {
  return Math.min(
    WORKSPACE_PEOPLE_MAX_ROW_HEIGHT,
    Math.max(WORKSPACE_PEOPLE_MIN_ROW_HEIGHT, rowHeight)
  )
}

export function WorkspacePeopleColumnResizeHandle({
  header,
  onColumnSizeChange,
  onColumnAutoSize,
}: {
  header: Header<OrgPersonWithImage, unknown>
  onColumnSizeChange: (columnId: string, size: number) => void
  onColumnAutoSize: (columnId: string) => void
}) {
  const column = header.column
  const minSize = column.columnDef.minSize ?? 20
  const maxSize = column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
  const columnLabel = column.id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase())

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey
      ? COLUMN_RESIZE_KEYBOARD_STEP * 2
      : COLUMN_RESIZE_KEYBOARD_STEP
    let nextSize: number | null = null

    if (event.key === "ArrowLeft") nextSize = column.getSize() - step
    if (event.key === "ArrowRight") nextSize = column.getSize() + step
    if (event.key === "Home") nextSize = minSize
    if (event.key === "End") nextSize = maxSize
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      onColumnAutoSize(column.id)
      return
    }
    if (nextSize === null) return

    event.preventDefault()
    event.stopPropagation()
    onColumnSizeChange(
      column.id,
      Math.min(maxSize, Math.max(minSize, nextSize))
    )
  }

  const resizeHandler = header.getResizeHandler()

  return (
    <div
      role="separator"
      aria-label={`Resize ${columnLabel} column`}
      aria-orientation="vertical"
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      aria-valuenow={column.getSize()}
      tabIndex={0}
      className="group/column-resize nodrag nopan absolute top-0 right-0 z-10 flex h-full w-3 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
      onMouseDown={resizeHandler}
      onTouchStart={resizeHandler}
      onKeyDown={handleKeyDown}
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onColumnAutoSize(column.id)
      }}
    >
      <span
        aria-hidden
        className={cn(
          "group-hover/column-resize:bg-foreground/45 group-focus-visible/column-resize:bg-foreground/60 h-5 w-px rounded-full bg-transparent transition-colors",
          column.getIsResizing() && "bg-foreground/60"
        )}
      />
    </div>
  )
}

export function WorkspacePeopleRowResizeHandle({
  rowId,
  rowLabel,
  rowHeight,
  defaultRowHeight,
  onRowHeightChange,
  onRowHeightReset,
}: {
  rowId: string
  rowLabel: string
  rowHeight: number
  defaultRowHeight: number
  onRowHeightChange: (rowId: string, rowHeight: number) => void
  onRowHeightReset: (rowId: string) => void
}) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const stopResizing = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  useEffect(() => stopResizing, [stopResizing])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      stopResizing()

      const startY = event.clientY
      const startHeight = rowHeight
      const previousCursor = document.body.style.cursor
      const previousUserSelect = document.body.style.userSelect

      document.body.style.cursor = "row-resize"
      document.body.style.userSelect = "none"

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        onRowHeightChange(
          rowId,
          clampWorkspacePeopleRowHeight(
            startHeight + moveEvent.clientY - startY
          )
        )
      }

      const handlePointerUp = () => stopResizing()
      const cleanup = () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("pointercancel", handlePointerUp)
        document.body.style.cursor = previousCursor
        document.body.style.userSelect = previousUserSelect
      }

      cleanupRef.current = cleanup
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerUp)
    },
    [onRowHeightChange, rowHeight, rowId, stopResizing]
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey
      ? ROW_RESIZE_KEYBOARD_STEP * 2
      : ROW_RESIZE_KEYBOARD_STEP
    let nextHeight: number | null = null

    if (event.key === "ArrowUp") nextHeight = rowHeight - step
    if (event.key === "ArrowDown") nextHeight = rowHeight + step
    if (event.key === "Home") nextHeight = WORKSPACE_PEOPLE_MIN_ROW_HEIGHT
    if (event.key === "End") nextHeight = WORKSPACE_PEOPLE_MAX_ROW_HEIGHT
    if (event.key === "Enter") nextHeight = defaultRowHeight
    if (nextHeight === null) return

    event.preventDefault()
    event.stopPropagation()
    onRowHeightChange(rowId, clampWorkspacePeopleRowHeight(nextHeight))
  }

  return (
    <div
      role="separator"
      aria-label={`Resize ${rowLabel} row`}
      aria-orientation="horizontal"
      aria-valuemin={WORKSPACE_PEOPLE_MIN_ROW_HEIGHT}
      aria-valuemax={WORKSPACE_PEOPLE_MAX_ROW_HEIGHT}
      aria-valuenow={rowHeight}
      tabIndex={0}
      title={`Resize ${rowLabel} row`}
      className="group/row-resize nodrag nopan absolute bottom-0 left-0 z-10 h-2 cursor-row-resize touch-none focus-visible:outline-none"
      style={{
        width: "calc(var(--workspace-people-table-width) * 1px)",
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onRowHeightReset(rowId)
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <span
        aria-hidden
        className="group-hover/row-resize:bg-foreground/35 group-focus-visible/row-resize:bg-foreground/55 absolute inset-x-0 bottom-0 h-px bg-transparent"
      />
    </div>
  )
}
