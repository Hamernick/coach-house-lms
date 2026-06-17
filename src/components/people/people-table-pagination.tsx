"use client"

import type { Table as ReactTable } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type PeopleTablePaginationProps<TData> = {
  table: ReactTable<TData>
  canEdit: boolean
  filteredCount: number
  className?: string
  showSelectionCount?: boolean
}

export function PeopleTablePagination<TData>({
  table,
  canEdit,
  filteredCount,
  className,
  showSelectionCount = canEdit,
}: PeopleTablePaginationProps<TData>) {
  const pageCount = Math.max(table.getPageCount(), 1)

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col gap-2 px-1 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        {showSelectionCount ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of {filteredCount}{" "}
            selected
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
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
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
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
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
              onClick={() => table.setPageIndex(pageCount - 1)}
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
