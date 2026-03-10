"use client"

import type { Table as ReactTable } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { PersonRow } from "@/components/people/people-table-types"

type PeopleTablePaginationProps = {
  table: ReactTable<PersonRow>
  canEdit: boolean
  filteredCount: number
}

export function PeopleTablePagination({ table, canEdit, filteredCount }: PeopleTablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
      <div>
        {canEdit ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of {filteredCount} selected
          </>
        ) : (
          <>
            {filteredCount} {filteredCount === 1 ? "person" : "people"}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="rows-per-page" className="text-xs">
          Rows per page
        </Label>
        <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger id="rows-per-page" size="sm" className="w-20">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent align="end">
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-4 inline-flex items-center gap-3">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="inline-flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              «
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              »
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
