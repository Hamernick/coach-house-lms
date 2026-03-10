"use client"

import { Button } from "@/components/ui/button"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { SortColumn, SortDirection } from "../types"
import { SortIndicator } from "./document-row-meta"

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
      className="h-auto px-0 py-0 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
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

export function DocumentsResultsTableHeader({
  sortColumn,
  sortDirection,
  onToggleSortColumn,
}: DocumentsResultsTableHeaderProps) {
  return (
    <TableHeader className="bg-muted/40">
      <TableRow>
        <TableHead>
          <SortHeaderButton
            column="status"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Status
          </SortHeaderButton>
        </TableHead>
        <TableHead className="min-w-[300px]">
          <SortHeaderButton
            column="name"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Name
          </SortHeaderButton>
        </TableHead>
        <TableHead className="text-right">Actions</TableHead>
        <TableHead>
          <SortHeaderButton
            column="category"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Category
          </SortHeaderButton>
        </TableHead>
        <TableHead>
          <SortHeaderButton
            column="source"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Source
          </SortHeaderButton>
        </TableHead>
        <TableHead>
          <SortHeaderButton
            column="visibility"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Visibility
          </SortHeaderButton>
        </TableHead>
        <TableHead>
          <SortHeaderButton
            column="updatedAt"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={onToggleSortColumn}
          >
            Last updated
          </SortHeaderButton>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
