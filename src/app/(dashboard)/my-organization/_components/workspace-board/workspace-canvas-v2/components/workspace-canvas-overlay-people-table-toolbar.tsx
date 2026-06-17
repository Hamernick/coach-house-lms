"use client"

import Columns3Icon from "lucide-react/dist/esm/icons/columns-3"
import type { Table as ReactTable } from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS } from "./workspace-canvas-overlay-people-table-columns"
import { WorkspacePeopleDrawerSelectionActions } from "./workspace-canvas-overlay-people-table-selection-actions"

type WorkspacePeopleDrawerTableToolbarProps = {
  peopleCount: number
  selectedCount: number
  table: ReactTable<OrgPersonWithImage>
  allPeople: OrgPersonWithImage[]
  viewerId: string
  placedPersonIds: ReadonlySet<string>
  customSegment: WorkspaceCustomPeopleSegment | null
  customSegmentMemberIds: ReadonlySet<string> | null
  canEdit: boolean
  onAddPeopleToCanvas: (personIds: string[]) => number
  onAddToSegment: (personIds: string[]) => void
  onRemoveFromSegment: (personIds: string[]) => void
}

export function WorkspacePeopleDrawerTableToolbar({
  peopleCount,
  selectedCount,
  table,
  allPeople,
  viewerId,
  placedPersonIds,
  customSegment,
  customSegmentMemberIds,
  canEdit,
  onAddPeopleToCanvas,
  onAddToSegment,
  onRemoveFromSegment,
}: WorkspacePeopleDrawerTableToolbarProps) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
  const selectedPeople = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)

  return (
    <div className="border-border/60 flex min-h-11 min-w-0 flex-col items-stretch gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground max-w-full min-w-0 truncate text-xs font-medium sm:max-w-52">
        {selectedCount > 0
          ? `${selectedCount} selected`
          : `${peopleCount} ${peopleCount === 1 ? "person" : "people"}`}
      </p>

      <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-1.5 sm:ml-auto sm:w-auto sm:justify-end">
        <WorkspacePeopleDrawerSelectionActions
          selectedPeople={selectedPeople}
          allPeople={allPeople}
          viewerId={viewerId}
          placedPersonIds={placedPersonIds}
          customSegment={customSegment}
          customSegmentMemberIds={customSegmentMemberIds}
          canEdit={canEdit}
          onAddPeopleToCanvas={onAddPeopleToCanvas}
          onAddToSegment={onAddToSegment}
          onRemoveFromSegment={onRemoveFromSegment}
          onClearSelection={() => table.resetRowSelection()}
        />
        {hideableColumns.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-foreground h-8 shrink-0 gap-1.5 rounded-lg px-2.5"
              >
                <Columns3Icon aria-hidden />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS[column.id] ??
                      column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
