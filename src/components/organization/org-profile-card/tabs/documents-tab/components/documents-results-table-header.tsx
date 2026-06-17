"use client"

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { Button } from "@/components/ui/button"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  clampDocumentsResultsTableColumnWidth,
  type DocumentsResultsTableColumnId,
  type DocumentsResultsTableColumnWidths,
  getDocumentsResultsTableColumnConfig,
} from "./documents-results-table-columns"
import type { SortColumn, SortDirection } from "../types"
import { SortIndicator } from "./document-row-meta"

const KEYBOARD_RESIZE_STEP = 16

type SortHeaderButtonProps = {
  column: SortColumn
  sortColumn: SortColumn
  sortDirection: SortDirection
  onToggleSortColumn: (column: SortColumn) => void
  children: string
}

type DocumentsResultsTableHeaderProps = {
  sortColumn: SortColumn
  sortDirection: SortDirection
  onToggleSortColumn: (column: SortColumn) => void
  columnWidths: DocumentsResultsTableColumnWidths
  onColumnWidthChange: (
    columnId: DocumentsResultsTableColumnId,
    width: number
  ) => void
}

type ResizableTableHeadProps = {
  columnId: DocumentsResultsTableColumnId
  columnWidths: DocumentsResultsTableColumnWidths
  onColumnWidthChange: (
    columnId: DocumentsResultsTableColumnId,
    width: number
  ) => void
  className?: string
  children: ReactNode
}

function SortHeaderButton({
  column,
  sortColumn,
  sortDirection,
  onToggleSortColumn,
  children,
}: SortHeaderButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-auto px-0 py-0 text-left text-xs font-medium tracking-wide uppercase"
      onClick={() => onToggleSortColumn(column)}
    >
      {children}
      <SortIndicator
        column={column}
        activeColumn={sortColumn}
        direction={sortDirection}
      />
    </Button>
  )
}

function ColumnResizeHandle({
  columnId,
  width,
  onColumnWidthChange,
}: {
  columnId: DocumentsResultsTableColumnId
  width: number
  onColumnWidthChange: (
    columnId: DocumentsResultsTableColumnId,
    width: number
  ) => void
}) {
  const cleanupRef = useRef<(() => void) | null>(null)
  const column = getDocumentsResultsTableColumnConfig(columnId)

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
      event.currentTarget.setPointerCapture?.(event.pointerId)

      const startX = event.clientX
      const startWidth = width
      const previousCursor = document.body.style.cursor
      const previousUserSelect = document.body.style.userSelect

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        onColumnWidthChange(columnId, startWidth + moveEvent.clientX - startX)
      }

      const handlePointerUp = () => {
        stopResizing()
      }

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
    [columnId, onColumnWidthChange, stopResizing, width]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const resizeStep = event.shiftKey
        ? KEYBOARD_RESIZE_STEP * 2
        : KEYBOARD_RESIZE_STEP
      let nextWidth: number | null = null

      if (event.key === "ArrowLeft") {
        nextWidth = width - resizeStep
      } else if (event.key === "ArrowRight") {
        nextWidth = width + resizeStep
      } else if (event.key === "Home") {
        nextWidth = column.minWidth
      } else if (event.key === "End") {
        nextWidth = column.maxWidth
      } else if (event.key === "Enter") {
        nextWidth = column.defaultWidth
      }

      if (nextWidth === null) return
      event.preventDefault()
      onColumnWidthChange(columnId, nextWidth)
    },
    [column, columnId, onColumnWidthChange, width]
  )

  return (
    <div
      role="separator"
      aria-label={`Resize ${column.label} column`}
      aria-orientation="vertical"
      aria-valuemin={column.minWidth}
      aria-valuemax={column.maxWidth}
      aria-valuenow={clampDocumentsResultsTableColumnWidth(columnId, width)}
      tabIndex={0}
      className="group/column-resize absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={(event) => {
        event.preventDefault()
        onColumnWidthChange(columnId, column.defaultWidth)
      }}
    >
      <span
        aria-hidden
        className="group-hover/column-resize:bg-foreground/45 group-focus-visible/column-resize:bg-foreground/60 group-focus-visible/column-head:bg-foreground/60 group-hover/column-head:bg-border/70 h-5 w-px rounded-full bg-transparent transition-colors"
      />
    </div>
  )
}

function ResizableTableHead({
  columnId,
  columnWidths,
  onColumnWidthChange,
  className,
  children,
}: ResizableTableHeadProps) {
  return (
    <TableHead
      className={cn("group/column-head relative pr-6 select-none", className)}
      style={{ width: columnWidths[columnId] }}
    >
      {children}
      <ColumnResizeHandle
        columnId={columnId}
        width={columnWidths[columnId]}
        onColumnWidthChange={onColumnWidthChange}
      />
    </TableHead>
  )
}

export function DocumentsResultsTableHeader({
  sortColumn,
  sortDirection,
  onToggleSortColumn,
  columnWidths,
  onColumnWidthChange,
}: DocumentsResultsTableHeaderProps) {
  return (
    <TableHeader className="bg-muted/40">
      <TableRow>
        <ResizableTableHead
          columnId="status"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        >
          <SortHeaderButton
            column="status"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Status
          </SortHeaderButton>
        </ResizableTableHead>
        <ResizableTableHead
          columnId="name"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
          className="min-w-[300px]"
        >
          <SortHeaderButton
            column="name"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Name
          </SortHeaderButton>
        </ResizableTableHead>
        <ResizableTableHead
          columnId="category"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        >
          <SortHeaderButton
            column="category"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Category
          </SortHeaderButton>
        </ResizableTableHead>
        <ResizableTableHead
          columnId="updatedAt"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        >
          <SortHeaderButton
            column="updatedAt"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Last updated
          </SortHeaderButton>
        </ResizableTableHead>
        <ResizableTableHead
          columnId="visibility"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        >
          <SortHeaderButton
            column="visibility"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Visibility
          </SortHeaderButton>
        </ResizableTableHead>
        <ResizableTableHead
          columnId="actions"
          columnWidths={columnWidths}
          onColumnWidthChange={onColumnWidthChange}
        >
          Actions
        </ResizableTableHead>
      </TableRow>
    </TableHeader>
  )
}
