"use client"

import Columns3Icon from "lucide-react/dist/esm/icons/columns-3"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import SaveIcon from "lucide-react/dist/esm/icons/save"
import ScanLineIcon from "lucide-react/dist/esm/icons/scan-line"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import type { Table as ReactTable } from "@tanstack/react-table"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS } from "./workspace-canvas-overlay-people-table-columns"
import { WorkspacePeopleDrawerSelectionActions } from "./workspace-canvas-overlay-people-table-selection-actions"
import type {
  WorkspacePeopleTableContentMode,
  WorkspacePeopleTableRowHeight,
} from "./workspace-canvas-overlay-people-table-sizing"

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
  contentMode: WorkspacePeopleTableContentMode
  rowHeight: WorkspacePeopleTableRowHeight
  hasSavedLayout: boolean
  onApplySavedLayout: () => void
  onAutoSizeColumns: () => void
  onClearSavedLayout: () => void
  onContentModeChange: (contentMode: WorkspacePeopleTableContentMode) => void
  onResetColumnWidths: () => void
  onRowHeightChange: (rowHeight: WorkspacePeopleTableRowHeight) => void
  onSaveLayout: () => void
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
  contentMode,
  rowHeight,
  hasSavedLayout,
  onApplySavedLayout,
  onAutoSizeColumns,
  onClearSavedLayout,
  onContentModeChange,
  onResetColumnWidths,
  onRowHeightChange,
  onSaveLayout,
  onAddPeopleToCanvas,
  onAddToSegment,
  onRemoveFromSegment,
}: WorkspacePeopleDrawerTableToolbarProps) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
  const resizableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanResize())
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
            <DropdownMenuContent align="end" className="w-52">
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
              <DropdownMenuSeparator className="hidden md:block" />
              <DropdownMenuGroup className="hidden md:block">
                <DropdownMenuLabel>Row height</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={rowHeight}
                  onValueChange={(value) =>
                    onRowHeightChange(value as WorkspacePeopleTableRowHeight)
                  }
                >
                  <DropdownMenuRadioItem value="compact">
                    Compact
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="standard">
                    Default
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="spacious">
                    Spacious
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="hidden md:block" />
              <DropdownMenuGroup className="hidden md:block">
                <DropdownMenuLabel>Cell content</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={contentMode}
                  onValueChange={(value) =>
                    onContentModeChange(
                      value as WorkspacePeopleTableContentMode
                    )
                  }
                >
                  <DropdownMenuRadioItem value="wrap">
                    Wrap previews
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="truncate">
                    Truncate previews
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="hidden md:block" />
              <DropdownMenuItem
                className="hidden md:flex"
                onSelect={onAutoSizeColumns}
              >
                <ScanLineIcon aria-hidden />
                Auto-fit columns
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hidden md:flex">
                  Reset one column
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {resizableColumns.map((column) => (
                    <DropdownMenuItem
                      key={column.id}
                      onSelect={() => column.resetSize()}
                    >
                      {WORKSPACE_PEOPLE_DRAWER_COLUMN_LABELS[column.id] ??
                        column.id}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className="hidden md:flex"
                onSelect={onResetColumnWidths}
              >
                <RotateCcwIcon aria-hidden />
                Reset column widths
              </DropdownMenuItem>
              <DropdownMenuSeparator className="hidden md:block" />
              <DropdownMenuLabel className="hidden md:block">
                Saved layout
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="hidden md:flex"
                onSelect={onSaveLayout}
              >
                <SaveIcon aria-hidden />
                Save current layout
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hidden md:flex"
                disabled={!hasSavedLayout}
                onSelect={onApplySavedLayout}
              >
                <FolderOpenIcon aria-hidden />
                Apply saved layout
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive hidden md:flex"
                disabled={!hasSavedLayout}
                onSelect={onClearSavedLayout}
              >
                <Trash2Icon aria-hidden />
                Clear saved layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
