"use client"

import { memo, useCallback, useMemo, useRef, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table"

import { PeopleTablePagination } from "@/components/people/people-table-pagination"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { WorkspacePeopleMobileList } from "./workspace-canvas-overlay-people-mobile-list"
import { WorkspacePeopleDrawerTableBody } from "./workspace-canvas-overlay-people-table-body"
import { buildWorkspacePeopleDrawerColumns } from "./workspace-canvas-overlay-people-table-columns"
import type { WorkspacePeopleDrawerTableProps } from "./workspace-canvas-overlay-people-table-contract"
import { useWorkspacePeopleTableMenuState } from "./workspace-canvas-overlay-people-table-menu-state"
import { useWorkspacePeopleTableSizing } from "./workspace-canvas-overlay-people-table-preferences"
import {
  WorkspacePeopleColumnResizeHandle,
  buildWorkspacePeopleColumnSizeVars,
  measureWorkspacePeopleColumnWidth,
} from "./workspace-canvas-overlay-people-table-sizing"
import { WorkspacePeopleDrawerTableToolbar } from "./workspace-canvas-overlay-people-table-toolbar"

export const WorkspacePeopleDrawerTable = memo(
  function WorkspacePeopleDrawerTable(props: WorkspacePeopleDrawerTableProps) {
    const [editingPerson, setEditingPerson] =
      useState<OrgPersonWithImage | null>(null)

    return (
      <>
        <WorkspacePeopleDrawerTableContent
          {...props}
          onEditPerson={setEditingPerson}
        />
        {editingPerson ? (
          <CreatePersonDialog
            initial={editingPerson}
            open
            readOnly={!props.canEdit}
            onOpenChange={(open) => {
              if (!open) setEditingPerson(null)
            }}
            onSaved={() => setEditingPerson(null)}
            people={props.allPeople}
            triggerClassName="hidden"
          />
        ) : null}
      </>
    )
  }
)

function WorkspacePeopleDrawerTableContent({
  people,
  allPeople,
  viewerId,
  uiPreferencesScope,
  placedPersonIds,
  customSegment,
  segments,
  tags,
  draggingPersonIds,
  canEdit,
  showReportsTo,
  label,
  onDragStart,
  onDragEnd,
  onAdd,
  onRemove,
  onAddPersonToSegment,
  onCreateSegment,
  onRemovePersonFromSegment,
  onAddPersonToTag,
  onCreateTag,
  onDeleteTag,
  onRemovePersonFromTag,
  onUpdateTag,
  onEditPerson,
  onAddPeopleToCanvas,
  onRemovePersonFromCanvas,
}: WorkspacePeopleDrawerTableProps & {
  onEditPerson: (person: OrgPersonWithImage) => void
}) {
  const customSegmentMemberIds = useMemo(
    () => (customSegment ? new Set(customSegment.memberIds) : null),
    [customSegment]
  )
  const peopleById = useMemo(
    () => new Map(allPeople.map((person) => [person.id, person])),
    [allPeople]
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const {
    handleSegmentMenuOpenChange,
    handleTagMenuOpenChange,
    openSegmentMenuPersonId,
    openTagMenuPersonId,
  } = useWorkspacePeopleTableMenuState()
  const {
    columnSizing,
    contentMode,
    defaultRowHeight,
    handleApplySavedLayout,
    handleClearSavedLayout,
    handleColumnSizeChange,
    handleColumnSizingChange,
    handleContentModeChange,
    handleResetColumnWidths,
    handleRowHeightChange,
    handleRowSizeChange,
    handleRowSizeReset,
    handleSaveLayout,
    rowHeight,
    rowSizing,
    savedColumnSizing,
    setColumnSizing,
  } = useWorkspacePeopleTableSizing(uiPreferencesScope)

  const columns = useMemo(
    () =>
      buildWorkspacePeopleDrawerColumns({
        peopleById,
        tags,
        canEdit,
        contentMode,
        rowHeight,
        showReportsTo,
        segments,
        customSegment,
        customSegmentMemberIds,
        onAdd,
        onRemove,
        onAddPeopleToCanvas,
        onRemovePersonFromCanvas,
        onAddPersonToSegment,
        onCreateSegment,
        onRemovePersonFromSegment,
        onAddPersonToTag,
        onCreateTag,
        onDeleteTag,
        onRemovePersonFromTag,
        onUpdateTag,
        onEditPerson,
        openSegmentMenuPersonId,
        openTagMenuPersonId,
        onSegmentMenuOpenChange: handleSegmentMenuOpenChange,
        onTagMenuOpenChange: handleTagMenuOpenChange,
        placedPersonIds,
      }),
    [
      canEdit,
      contentMode,
      customSegment,
      customSegmentMemberIds,
      onAdd,
      onAddPeopleToCanvas,
      onRemove,
      onRemovePersonFromCanvas,
      onAddPersonToSegment,
      onCreateSegment,
      onRemovePersonFromSegment,
      onAddPersonToTag,
      onCreateTag,
      onDeleteTag,
      onRemovePersonFromTag,
      onUpdateTag,
      onEditPerson,
      openSegmentMenuPersonId,
      openTagMenuPersonId,
      handleSegmentMenuOpenChange,
      handleTagMenuOpenChange,
      peopleById,
      placedPersonIds,
      segments,
      rowHeight,
      showReportsTo,
      tags,
    ]
  )

  const table = useReactTable({
    data: people,
    columns,
    state: {
      columnSizing,
      columnVisibility,
      rowSelection,
    },
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: handleColumnSizingChange,
    onRowSelectionChange: setRowSelection,
  })
  const selectedCount = table.getSelectedRowModel().rows.length
  const handleAutoSizeColumn = useCallback(
    (columnId: string) => {
      const container = tableScrollRef.current
      const column = table.getColumn(columnId)
      if (!container || !column?.getCanResize()) return

      handleColumnSizeChange(
        columnId,
        measureWorkspacePeopleColumnWidth(container, columnId, column.getSize())
      )
    },
    [handleColumnSizeChange, table]
  )
  const handleAutoSizeColumns = useCallback(() => {
    const container = tableScrollRef.current
    if (!container) return

    setColumnSizing((currentSizing) => {
      const nextSizing = { ...currentSizing }
      table.getVisibleLeafColumns().forEach((column) => {
        if (!column.getCanResize()) return
        nextSizing[column.id] = measureWorkspacePeopleColumnWidth(
          container,
          column.id,
          currentSizing[column.id] ?? column.getSize()
        )
      })
      return nextSizing
    })
  }, [setColumnSizing, table])
  const columnSizeVars = useMemo(
    () =>
      buildWorkspacePeopleColumnSizeVars(table, columnSizing, columnVisibility),
    [columnSizing, columnVisibility, table]
  )

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
        contentMode={contentMode}
        rowHeight={rowHeight}
        hasSavedLayout={savedColumnSizing !== null}
        onApplySavedLayout={handleApplySavedLayout}
        onAutoSizeColumns={handleAutoSizeColumns}
        onClearSavedLayout={handleClearSavedLayout}
        onContentModeChange={handleContentModeChange}
        onResetColumnWidths={handleResetColumnWidths}
        onRowHeightChange={handleRowHeightChange}
        onSaveLayout={handleSaveLayout}
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
        segments={segments}
        tags={tags}
        draggingPersonIds={draggingPersonIds}
        draggable
        canEdit={canEdit}
        showReportsTo={showReportsTo}
        label={label}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onAdd={onAdd}
        onRemove={onRemove}
        onAddPersonToSegment={onAddPersonToSegment}
        onCreateSegment={onCreateSegment}
        onRemovePersonFromSegment={onRemovePersonFromSegment}
        onAddPersonToTag={onAddPersonToTag}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        onRemovePersonFromTag={onRemovePersonFromTag}
        onUpdateTag={onUpdateTag}
        onEditPerson={onEditPerson}
        onAddPeopleToCanvas={onAddPeopleToCanvas}
        onRemovePersonFromCanvas={onRemovePersonFromCanvas}
      />
      <div
        ref={tableScrollRef}
        className="hidden max-h-[60vh] max-w-full overflow-auto overscroll-contain will-change-auto md:block [&>[data-slot=table-container]]:overflow-visible"
      >
        <Table
          aria-label={label}
          className="grid w-auto border-collapse"
          style={{
            ...columnSizeVars,
            width: "calc(var(--workspace-people-table-width) * 1px)",
            minWidth: "calc(var(--workspace-people-table-width) * 1px)",
          }}
        >
          <TableHeader className="grid">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="flex hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    data-workspace-people-column={header.column.id}
                    style={{
                      width: `calc(var(--header-${header.id}-size) * 1px)`,
                      ...(header.column.id === "person"
                        ? {
                            left: "calc(var(--col-select-size) * 1px)",
                          }
                        : {}),
                    }}
                    className={cn(
                      "bg-muted sticky top-0 z-20 flex h-9 shrink-0 items-center px-3 py-1.5 text-xs select-none",
                      header.column.id === "select" &&
                        "border-border right-auto left-0 z-40 grid place-items-center border-r p-0",
                      header.column.id === "person" &&
                        "border-border z-30 border-r",
                      header.column.id === "action" &&
                        "justify-start text-left",
                      header.column.id === "canvas" &&
                        "bg-muted right-0 z-40 px-2 text-right"
                    )}
                  >
                    <div
                      className={cn(
                        "min-w-0 truncate overflow-hidden",
                        header.column.id === "select" && "w-full",
                        header.column.id !== "select" && "pr-1"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </div>
                    {header.column.getCanResize() ? (
                      <WorkspacePeopleColumnResizeHandle
                        header={header}
                        onColumnSizeChange={handleColumnSizeChange}
                        onColumnAutoSize={handleAutoSizeColumn}
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <WorkspacePeopleDrawerTableBody
            table={table}
            columnDefinitions={columns}
            people={people}
            pagination={table.getState().pagination}
            rowSelection={rowSelection}
            columnVisibility={columnVisibility}
            placedPersonIds={placedPersonIds}
            draggingPersonIds={draggingPersonIds}
            rowSizing={rowSizing}
            defaultRowHeight={defaultRowHeight}
            contentMode={contentMode}
            tableScrollRef={tableScrollRef}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRowHeightChange={handleRowSizeChange}
            onRowHeightReset={handleRowSizeReset}
          />
        </Table>
      </div>
      <PeopleTablePagination
        table={table}
        canEdit={canEdit}
        filteredCount={people.length}
        pageSizeOptions={[10, 20, 50, 100]}
        className="border-border/60 border-t px-3 py-2"
      />
    </div>
  )
}
