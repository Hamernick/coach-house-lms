"use client"

import { memo, useMemo, useState, type DragEvent } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table"

import { PeopleTablePagination } from "@/components/people/people-table-pagination"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { WorkspacePeopleMobileList } from "./workspace-canvas-overlay-people-mobile-list"
import { buildWorkspacePeopleDrawerColumns } from "./workspace-canvas-overlay-people-table-columns"
import { WorkspacePeopleDrawerTableToolbar } from "./workspace-canvas-overlay-people-table-toolbar"

type WorkspacePeopleDrawerTableProps = {
  people: OrgPersonWithImage[]
  allPeople: OrgPersonWithImage[]
  viewerId: string
  placedPersonIds: ReadonlySet<string>
  customSegment: WorkspaceCustomPeopleSegment | null
  canEdit: boolean
  label: string
  onDragStart: (personIds: string[], event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onAdd: (personId: string) => void
  onRemove: (personId: string) => void
  onAddPeopleToCanvas: (personIds: string[]) => number
}

export const WorkspacePeopleDrawerTable = memo(
  function WorkspacePeopleDrawerTable({
    people,
    allPeople,
    viewerId,
    placedPersonIds,
    customSegment,
    canEdit,
    label,
    onDragStart,
    onDragEnd,
    onAdd,
    onRemove,
    onAddPeopleToCanvas,
  }: WorkspacePeopleDrawerTableProps) {
    const customSegmentMemberIds = useMemo(
      () => (customSegment ? new Set(customSegment.memberIds) : null),
      [customSegment]
    )
    const peopleById = useMemo(
      () => new Map(allPeople.map((person) => [person.id, person])),
      [allPeople]
    )
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
      {}
    )

    const columns = useMemo(
      () =>
        buildWorkspacePeopleDrawerColumns({
          peopleById,
          customSegment,
          customSegmentMemberIds,
          onAdd,
          onRemove,
          placedPersonIds,
        }),
      [
        customSegment,
        customSegmentMemberIds,
        onAdd,
        onRemove,
        peopleById,
        placedPersonIds,
      ]
    )

    const table = useReactTable({
      data: people,
      columns,
      state: {
        columnVisibility,
        rowSelection,
      },
      enableRowSelection: true,
      enableMultiRowSelection: true,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getRowId: (row) => row.id,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
    })
    const selectedCount = table.getSelectedRowModel().rows.length
    const resolveRowDragPersonIds = (person: OrgPersonWithImage) => {
      const row = table.getRow(person.id)
      if (!row?.getIsSelected()) return [person.id]

      const selectedPersonIds = table
        .getSelectedRowModel()
        .rows.map((selectedRow) => selectedRow.original.id)

      return selectedPersonIds.length > 0 ? selectedPersonIds : [person.id]
    }

    return (
      <div className="border-border/60 bg-background/72 w-full max-w-full min-w-0 overflow-hidden rounded-2xl border shadow-xs [contain-intrinsic-size:0_24rem] [content-visibility:auto]">
        <WorkspacePeopleDrawerTableToolbar
          peopleCount={people.length}
          selectedCount={selectedCount}
          table={table}
          allPeople={allPeople}
          viewerId={viewerId}
          placedPersonIds={placedPersonIds}
          customSegment={customSegment}
          customSegmentMemberIds={customSegmentMemberIds}
          canEdit={canEdit}
          onAddPeopleToCanvas={onAddPeopleToCanvas}
          onAddToSegment={(personIds) => {
            personIds.forEach(onAdd)
          }}
          onRemoveFromSegment={(personIds) => {
            personIds.forEach(onRemove)
          }}
        />
        <WorkspacePeopleMobileList
          table={table}
          placedPersonIds={placedPersonIds}
          peopleById={peopleById}
          customSegment={customSegment}
          customSegmentMemberIds={customSegmentMemberIds}
          draggable
          label={label}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onAdd={onAdd}
          onRemove={onRemove}
        />
        <div className="hidden max-h-[60vh] max-w-full overflow-auto overscroll-x-contain will-change-auto md:block">
          <Table aria-label={label} className="min-w-[58rem]">
            <TableHeader className="bg-muted/35">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-8 px-3 text-xs",
                        header.column.id === "select" && "w-10 px-2",
                        header.column.id === "person" && "min-w-[14rem]",
                        header.column.id === "relationship" && "min-w-[10rem]",
                        header.column.id === "reportsTo" && "min-w-[11rem]",
                        header.column.id === "email" && "min-w-[12rem]",
                        header.column.id === "linkedin" && "min-w-[11rem]",
                        header.column.id === "action" && "w-12 text-right",
                        header.column.id === "canvas" && "w-28 px-2 text-right"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const person = row.original
                const placed = placedPersonIds.has(person.id)

                return (
                  <TableRow
                    key={row.id}
                    draggable
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    data-workspace-person-placed={placed ? "true" : undefined}
                    onDragStart={(event) =>
                      onDragStart(resolveRowDragPersonIds(person), event)
                    }
                    onDragEnd={onDragEnd}
                    className={cn(
                      "group transition-colors [contain-intrinsic-size:0_3.25rem] [content-visibility:auto]",
                      "cursor-grab active:cursor-grabbing",
                      placed &&
                        "bg-muted/25 text-muted-foreground hover:bg-muted/35"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 py-2",
                          cell.column.id === "select" && "w-10 px-2",
                          cell.column.id === "person" && "min-w-[14rem]",
                          cell.column.id === "relationship" && "min-w-[10rem]",
                          cell.column.id === "reportsTo" && "min-w-[11rem]",
                          cell.column.id === "email" &&
                            "text-muted-foreground min-w-[12rem] text-sm",
                          cell.column.id === "linkedin" &&
                            "min-w-[11rem] text-sm",
                          cell.column.id === "action" && "w-12 text-right",
                          cell.column.id === "canvas" && "w-28 px-2 text-right"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <PeopleTablePagination
          table={table}
          canEdit={canEdit}
          filteredCount={people.length}
          className="border-border/60 border-t px-3 py-2"
        />
      </div>
    )
  }
)
