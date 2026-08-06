"use client"

import { memo, useEffect, type DragEvent, type RefObject } from "react"
import {
  flexRender,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type Table as ReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import {
  WorkspacePeopleRowResizeHandle,
  type WorkspacePeopleRowSizing,
  type WorkspacePeopleTableContentMode,
} from "./workspace-canvas-overlay-people-table-sizing"

type WorkspacePeopleDrawerTableBodyProps = {
  table: ReactTable<OrgPersonWithImage>
  columnDefinitions: ColumnDef<OrgPersonWithImage>[]
  people: OrgPersonWithImage[]
  pagination: PaginationState
  rowSelection: RowSelectionState
  columnVisibility: VisibilityState
  placedPersonIds: ReadonlySet<string>
  draggingPersonIds: ReadonlySet<string>
  rowSizing: WorkspacePeopleRowSizing
  defaultRowHeight: number
  contentMode: WorkspacePeopleTableContentMode
  tableScrollRef: RefObject<HTMLDivElement | null>
  onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onRowHeightChange: (rowId: string, rowHeight: number) => void
  onRowHeightReset: (rowId: string) => void
}

function tableBodyPropsAreEqual(
  previous: WorkspacePeopleDrawerTableBodyProps,
  next: WorkspacePeopleDrawerTableBodyProps
) {
  return (
    previous.table === next.table &&
    previous.columnDefinitions === next.columnDefinitions &&
    previous.people === next.people &&
    previous.pagination.pageIndex === next.pagination.pageIndex &&
    previous.pagination.pageSize === next.pagination.pageSize &&
    previous.rowSelection === next.rowSelection &&
    previous.columnVisibility === next.columnVisibility &&
    previous.placedPersonIds === next.placedPersonIds &&
    previous.draggingPersonIds === next.draggingPersonIds &&
    previous.rowSizing === next.rowSizing &&
    previous.defaultRowHeight === next.defaultRowHeight &&
    previous.contentMode === next.contentMode &&
    previous.tableScrollRef === next.tableScrollRef &&
    previous.onDragStart === next.onDragStart &&
    previous.onDragEnd === next.onDragEnd &&
    previous.onRowHeightChange === next.onRowHeightChange &&
    previous.onRowHeightReset === next.onRowHeightReset
  )
}

export const WorkspacePeopleDrawerTableBody = memo(
  function WorkspacePeopleDrawerTableBody({
    table,
    placedPersonIds,
    draggingPersonIds,
    rowSizing,
    defaultRowHeight,
    contentMode,
    tableScrollRef,
    onDragStart,
    onDragEnd,
    onRowHeightChange,
    onRowHeightReset,
  }: WorkspacePeopleDrawerTableBodyProps) {
    const rows = table.getRowModel().rows
    const shouldVirtualize = rows.length >= 100
    const rowVirtualizer = useVirtualizer({
      count: shouldVirtualize ? rows.length : 0,
      getScrollElement: () => tableScrollRef.current,
      estimateSize: (index) =>
        rowSizing[rows[index]?.id ?? ""] ?? defaultRowHeight,
      getItemKey: (index) => rows[index]?.id ?? index,
      overscan: 8,
    })

    useEffect(() => {
      if (!shouldVirtualize) return
      rowVirtualizer.measure()
    }, [
      contentMode,
      defaultRowHeight,
      rowSizing,
      rowVirtualizer,
      shouldVirtualize,
    ])

    const resolveRowDragPersonIds = (person: OrgPersonWithImage) => {
      const row = table.getRow(person.id)
      if (!row?.getIsSelected()) return [person.id]

      const selectedPersonIds = table
        .getSelectedRowModel()
        .rows.map((selectedRow) => selectedRow.original.id)

      return selectedPersonIds.length > 0 ? selectedPersonIds : [person.id]
    }

    const renderRow = (
      row: (typeof rows)[number],
      virtualPosition?: { index: number; start: number }
    ) => {
      const person = row.original
      const placed = placedPersonIds.has(person.id)
      const dragging = draggingPersonIds.has(person.id)
      const resolvedRowHeight = rowSizing[row.id] ?? defaultRowHeight

      return (
        <TableRow
          key={row.id}
          ref={
            virtualPosition
              ? (element) => rowVirtualizer.measureElement(element)
              : undefined
          }
          data-index={virtualPosition?.index}
          draggable
          data-state={row.getIsSelected() ? "selected" : undefined}
          data-workspace-person-placed={placed ? "true" : undefined}
          data-workspace-person-dragging={dragging ? "true" : undefined}
          style={{
            ...(virtualPosition
              ? {
                  minHeight: resolvedRowHeight,
                  position: "absolute",
                  transform: `translateY(${virtualPosition.start}px)`,
                  width: "calc(var(--workspace-people-table-width) * 1px)",
                }
              : { minHeight: resolvedRowHeight }),
          }}
          onDragStart={(event) =>
            onDragStart(resolveRowDragPersonIds(person), event)
          }
          onDragEnd={onDragEnd}
          className={cn(
            "group flex cursor-grab transition-colors active:cursor-grabbing",
            virtualPosition && "top-0 left-0",
            dragging && "opacity-60",
            placed && "bg-muted/25 text-muted-foreground hover:bg-muted/35"
          )}
        >
          {row.getVisibleCells().map((cell) => {
            const columnWidth = `calc(var(--col-${cell.column.id}-size) * 1px)`
            const selectCell = cell.column.id === "select"
            const personCell = cell.column.id === "person"
            const actionCell = cell.column.id === "action"
            const canvasCell = cell.column.id === "canvas"
            const wrapsText =
              contentMode === "wrap" &&
              !selectCell &&
              cell.column.id !== "role" &&
              !actionCell &&
              !canvasCell

            return (
              <TableCell
                key={cell.id}
                data-workspace-people-column={cell.column.id}
                style={{
                  width: columnWidth,
                  minWidth: columnWidth,
                  maxWidth: columnWidth,
                  ...(personCell
                    ? {
                        left: "calc(var(--col-select-size) * 1px)",
                      }
                    : {}),
                }}
                className={cn(
                  "flex min-w-0 shrink-0 items-center overflow-hidden px-3 py-1 [&>*]:max-w-full",
                  wrapsText
                    ? "break-words whitespace-normal"
                    : "whitespace-nowrap",
                  selectCell &&
                    "border-border bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted group-data-[workspace-person-placed=true]:bg-muted/25 sticky left-0 z-20 grid place-items-center overflow-visible border-r p-0",
                  personCell &&
                    "border-border bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted group-data-[workspace-person-placed=true]:bg-muted/25 sticky z-10 border-r",
                  cell.column.id === "email" && "text-muted-foreground text-sm",
                  wrapsText && cell.column.id === "email" && "break-all",
                  cell.column.id === "linkedin" && "text-sm",
                  actionCell && "grid place-items-center overflow-visible p-0",
                  canvasCell &&
                    "bg-background group-hover:bg-muted group-data-[state=selected]:bg-muted group-data-[workspace-person-placed=true]:bg-muted sticky right-0 z-20 px-2 text-right"
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                {selectCell ? (
                  <WorkspacePeopleRowResizeHandle
                    rowId={row.id}
                    rowLabel={person.name}
                    rowHeight={resolvedRowHeight}
                    defaultRowHeight={defaultRowHeight}
                    onRowHeightChange={onRowHeightChange}
                    onRowHeightReset={onRowHeightReset}
                  />
                ) : null}
              </TableCell>
            )
          })}
        </TableRow>
      )
    }

    return (
      <TableBody
        data-workspace-people-content-mode={contentMode}
        className={cn("grid", shouldVirtualize && "relative")}
        style={
          shouldVirtualize
            ? { height: rowVirtualizer.getTotalSize() }
            : undefined
        }
      >
        {shouldVirtualize
          ? rowVirtualizer
              .getVirtualItems()
              .map((virtualRow) =>
                renderRow(rows[virtualRow.index], virtualRow)
              )
          : rows.map((row) => renderRow(row))}
      </TableBody>
    )
  },
  tableBodyPropsAreEqual
)
