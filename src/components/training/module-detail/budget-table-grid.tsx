"use client"

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"
import { type DragEvent } from "react"

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { BudgetTableRow } from "@/lib/modules"
import { BUDGET_TABLE_MIN_WIDTH } from "./budget-table-column-config"

type BudgetTableGridProps = {
  table: TanstackTable<BudgetTableRow>
  tableCellClass: string
  draggingRow: number | null
  subtotal: number
  unitListId: string
  unitOptions: string[]
  formatMoney: (value: number) => string
  onRowDrop: (rowIndex: number, event: DragEvent<HTMLTableRowElement>) => void
  onRowDragEnd: () => void
  onStartColumnResize: () => void
}

export function BudgetTableGrid({
  table,
  tableCellClass,
  draggingRow,
  subtotal,
  unitListId,
  unitOptions,
  formatMoney,
  onRowDrop,
  onRowDragEnd,
  onStartColumnResize,
}: BudgetTableGridProps) {
  return (
    <>
      <Table
        className="w-full table-fixed text-xs"
        style={{ width: table.getTotalSize(), minWidth: BUDGET_TABLE_MIN_WIDTH }}
      >
        <TableHeader className="bg-transparent">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/60 bg-transparent hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                if (header.isPlaceholder) {
                  return null
                }
                const alignRight = header.column.columnDef.meta?.align === "right"
                const canResize = header.column.getCanResize()
                const resizeHandler = header.getResizeHandler()
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={cn(
                      "relative h-auto py-2 text-[11px] font-semibold text-muted-foreground align-middle whitespace-normal leading-snug",
                      header.column.id !== "category" && "border-l border-border/40",
                      alignRight && "text-right",
                    )}
                  >
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    {canResize ? (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                        onMouseDown={(event) => {
                          onStartColumnResize()
                          resizeHandler(event)
                        }}
                        onTouchStart={(event) => {
                          onStartColumnResize()
                          resizeHandler(event)
                        }}
                      />
                    ) : null}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                "border-border/40 bg-transparent hover:bg-transparent data-[state=selected]:bg-transparent",
                draggingRow === row.index && "opacity-70",
              )}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onRowDrop(row.index, event)}
              onDragEnd={onRowDragEnd}
            >
              {row.getVisibleCells().map((cell) => {
                const alignRight = cell.column.columnDef.meta?.align === "right"
                return (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className={cn(
                      tableCellClass,
                      cell.column.id !== "category" && "border-l border-border/40",
                      alignRight && "text-right",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent border-t border-border/60">
          <TableRow className="bg-transparent hover:bg-transparent">
            <TableCell
              colSpan={6}
              className="px-2 py-2 text-[11px] font-medium uppercase text-muted-foreground rounded-bl-xl"
            >
              <span className="sr-only">Subtotal: direct costs</span>
            </TableCell>
            <TableCell className="px-2 py-2 text-right text-xs font-semibold tabular-nums border-l border-border/60 bg-transparent">
              ${formatMoney(subtotal)}
            </TableCell>
            <TableCell className="px-2 py-2 border-l border-border/60 rounded-br-xl" />
          </TableRow>
        </TableFooter>
      </Table>

      <datalist id={unitListId}>
        {unitOptions.map((option) => (
          <option key={`budget-unit-option-${option}`} value={option} />
        ))}
      </datalist>
    </>
  )
}
