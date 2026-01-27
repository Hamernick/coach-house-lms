"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
} from "@tanstack/react-table"
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { BudgetTableRow } from "@/lib/modules"

type BudgetTableProps = {
  rows: BudgetTableRow[]
  blankRow: BudgetTableRow
  totals: number[]
  subtotal: number
  costTypeOptions: string[]
  unitOptions: string[]
  unitListId: string
  formatMoney: (value: number) => string
  onUpdateRow: (rowIndex: number, patch: Partial<BudgetTableRow>) => void
  onRowsChange: (rows: BudgetTableRow[]) => void
  frameClassName?: string
}

const COLUMN_ORDER = [
  "category",
  "description",
  "costType",
  "unit",
  "units",
  "costPerUnit",
  "totalCost",
  "actions",
] as const

const COLUMN_DEFAULTS: Record<(typeof COLUMN_ORDER)[number], number> = {
  category: 200,
  description: 300,
  costType: 150,
  unit: 150,
  units: 100,
  costPerUnit: 130,
  totalCost: 170,
  actions: 70,
}

const COLUMN_MINS: Record<(typeof COLUMN_ORDER)[number], number> = {
  category: 150,
  description: 210,
  costType: 120,
  unit: 110,
  units: 80,
  costPerUnit: 100,
  totalCost: 120,
  actions: 60,
}

const HEADER_LABELS: Record<(typeof COLUMN_ORDER)[number], string> = {
  category: "Expense Category",
  description: "Description / What This Covers",
  costType: "Cost Type",
  unit: "Unit (if variable)",
  units: "# of Units",
  costPerUnit: "Cost per Unit",
  totalCost: "Total Estimated Cost",
  actions: "Actions",
}

function fitColumnSizes(containerWidth: number): ColumnSizingState {
  if (!containerWidth || containerWidth <= 0) {
    return Object.fromEntries(
      COLUMN_ORDER.map((id) => [id, COLUMN_DEFAULTS[id]]),
    ) as ColumnSizingState
  }

  const minTotal = COLUMN_ORDER.reduce((sum, id) => sum + COLUMN_MINS[id], 0)
  if (containerWidth <= minTotal) {
    return Object.fromEntries(
      COLUMN_ORDER.map((id) => [id, COLUMN_MINS[id]]),
    ) as ColumnSizingState
  }

  const base = COLUMN_ORDER.map((id) => COLUMN_DEFAULTS[id])
  const mins = COLUMN_ORDER.map((id) => COLUMN_MINS[id])
  const widths = new Array(base.length).fill(0) as number[]
  let remaining = containerWidth
  let remainingIndexes = base.map((_, index) => index)
  let guard = 0

  while (remainingIndexes.length > 0 && guard < 8) {
    guard += 1
    const baseSum = remainingIndexes.reduce((sum, idx) => sum + base[idx], 0)
    if (baseSum <= 0) break
    let changed = false
    remainingIndexes = remainingIndexes.filter((idx) => {
      const scaled = Math.floor((base[idx] / baseSum) * remaining)
      if (scaled < mins[idx]) {
        widths[idx] = mins[idx]
        remaining -= widths[idx]
        changed = true
        return false
      }
      return true
    })
    if (!changed) {
      remainingIndexes.forEach((idx) => {
        widths[idx] = Math.max(mins[idx], Math.floor((base[idx] / baseSum) * remaining))
      })
      break
    }
    if (remaining <= 0) break
  }

  return Object.fromEntries(
    COLUMN_ORDER.map((id, idx) => [id, Math.max(mins[idx], widths[idx] || mins[idx])]),
  ) as ColumnSizingState
}

export function BudgetTable({
  rows,
  blankRow,
  totals,
  subtotal,
  costTypeOptions,
  unitOptions,
  unitListId,
  formatMoney,
  onUpdateRow,
  onRowsChange,
  frameClassName,
}: BudgetTableProps) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    fitColumnSizes(0),
  )
  const [userSized, setUserSized] = useState(false)
  const [draggingRow, setDraggingRow] = useState<number | null>(null)
  const tableFrameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (userSized) return
    const node = tableFrameRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const update = () => {
      const width = node.clientWidth
      if (!width) return
      setColumnSizing(fitColumnSizes(width))
    }
    update()
    const observer = new ResizeObserver(() => update())
    observer.observe(node)
    return () => observer.disconnect()
  }, [userSized])

  const moveRow = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
      const nextRows = [...rows]
      const [moved] = nextRows.splice(fromIndex, 1)
      if (!moved) return
      nextRows.splice(toIndex, 0, moved)
      onRowsChange(nextRows)
    },
    [onRowsChange, rows],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      const nextRows = [...rows]
      nextRows.splice(rowIndex, 1)
      if (nextRows.length === 0) nextRows.push(blankRow)
      onRowsChange(nextRows)
    },
    [blankRow, onRowsChange, rows],
  )

  const handleRowDragStart = useCallback(
    (rowIndex: number, event: DragEvent<HTMLButtonElement>) => {
      setDraggingRow(rowIndex)
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", String(rowIndex))
    },
    [],
  )

  const handleRowDrop = useCallback(
    (rowIndex: number, event: DragEvent<HTMLTableRowElement>) => {
      event.preventDefault()
      const payload = event.dataTransfer.getData("text/plain")
      const fromIndex = Number.parseInt(payload, 10)
      if (Number.isNaN(fromIndex)) {
        setDraggingRow(null)
        return
      }
      moveRow(fromIndex, rowIndex)
      setDraggingRow(null)
    },
    [moveRow],
  )

  const handleRowDragEnd = useCallback(() => {
    setDraggingRow(null)
  }, [])

  const tableCellClass =
    "relative min-h-11 p-0 align-middle whitespace-normal break-words bg-transparent"
  const tableCellFillClass =
    "absolute inset-0 flex h-full w-full items-center bg-transparent dark:bg-transparent"
  const tableCellFillStretchClass =
    "flex h-full w-full items-stretch bg-transparent dark:bg-transparent"
  const tableCellFillCenterClass =
    "absolute inset-0 flex h-full w-full items-center justify-center bg-transparent dark:bg-transparent"
  const tableInputClass =
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-2 text-xs shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0"
  const tableSelectClass =
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-0 text-xs shadow-none focus:border-border/60 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-[size=default]:h-full"
  const tableNumberClass =
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 text-right text-xs tabular-nums shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0"
  const tableMoneyClass =
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent pl-6 pr-2 text-right text-xs tabular-nums shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0"
  const tableTextareaClass =
    "min-h-11 h-full w-full min-w-0 resize-none overflow-hidden rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-2 text-xs leading-snug shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0"

  const columns = useMemo<ColumnDef<BudgetTableRow>[]>(() => {
    return [
      {
        id: "category",
        header: HEADER_LABELS.category,
        size: COLUMN_DEFAULTS.category,
        minSize: COLUMN_MINS.category,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={cn(tableCellFillClass, "gap-2 px-2")}>
              <button
                type="button"
                className="flex h-full w-6 items-center justify-center cursor-grab text-muted-foreground hover:text-foreground"
                draggable
                onDragStart={(event) => handleRowDragStart(rowIndex, event)}
                aria-label="Reorder row"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <Input
                value={row.original.category}
                placeholder="Expense category"
                className={tableInputClass}
                onChange={(event) => onUpdateRow(rowIndex, { category: event.currentTarget.value })}
              />
            </div>
          )
        },
      },
      {
        id: "description",
        header: HEADER_LABELS.description,
        size: COLUMN_DEFAULTS.description,
        minSize: COLUMN_MINS.description,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillStretchClass}>
              <Textarea
                value={row.original.description}
                placeholder="Description"
                rows={1}
                className={tableTextareaClass}
                onChange={(event) => onUpdateRow(rowIndex, { description: event.currentTarget.value })}
                onInput={(event) => {
                  const target = event.currentTarget
                  target.style.height = "0px"
                  const minHeight = Number.parseFloat(getComputedStyle(target).minHeight || "0") || 44
                  const nextHeight = Math.max(target.scrollHeight, minHeight)
                  target.style.height = `${nextHeight}px`
                }}
              />
            </div>
          )
        },
      },
      {
        id: "costType",
        header: HEADER_LABELS.costType,
        size: COLUMN_DEFAULTS.costType,
        minSize: COLUMN_MINS.costType,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillClass}>
              <Select
                value={row.original.costType || undefined}
                onValueChange={(next) => onUpdateRow(rowIndex, { costType: next })}
              >
                <SelectTrigger className={tableSelectClass}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {costTypeOptions.map((option) => (
                    <SelectItem key={`budget-cost-type-${option}`} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        },
      },
      {
        id: "unit",
        header: HEADER_LABELS.unit,
        size: COLUMN_DEFAULTS.unit,
        minSize: COLUMN_MINS.unit,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillClass}>
              <Input
                value={row.original.unit}
                placeholder="Unit"
                list={unitListId}
                className={tableInputClass}
                onChange={(event) => onUpdateRow(rowIndex, { unit: event.currentTarget.value })}
              />
            </div>
          )
        },
      },
      {
        id: "units",
        header: HEADER_LABELS.units,
        size: COLUMN_DEFAULTS.units,
        minSize: COLUMN_MINS.units,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillClass}>
              <Input
                value={row.original.units}
                placeholder="0"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className={tableNumberClass}
                onChange={(event) => onUpdateRow(rowIndex, { units: event.currentTarget.value })}
              />
            </div>
          )
        },
      },
      {
        id: "costPerUnit",
        header: HEADER_LABELS.costPerUnit,
        size: COLUMN_DEFAULTS.costPerUnit,
        minSize: COLUMN_MINS.costPerUnit,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillClass}>
              <div className="relative h-full w-full min-w-0">
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  $
                </span>
                <Input
                  value={row.original.costPerUnit}
                  placeholder="0.00"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  className={tableMoneyClass}
                  onChange={(event) => onUpdateRow(rowIndex, { costPerUnit: event.currentTarget.value })}
                />
              </div>
            </div>
          )
        },
      },
      {
        id: "totalCost",
        header: HEADER_LABELS.totalCost,
        size: COLUMN_DEFAULTS.totalCost,
        minSize: COLUMN_MINS.totalCost,
        enableResizing: true,
        cell: ({ row }) => {
          const total = totals[row.index] ?? 0
          return (
            <div className={tableCellFillClass}>
              <div className="relative h-full w-full min-w-0">
                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  $
                </span>
                <Input
                  value={formatMoney(total)}
                  readOnly
                  className={cn(tableMoneyClass, "font-semibold")}
                />
              </div>
            </div>
          )
        },
        meta: { align: "right" },
      },
      {
        id: "actions",
        header: HEADER_LABELS.actions,
        size: COLUMN_DEFAULTS.actions,
        minSize: COLUMN_MINS.actions,
        enableResizing: false,
        cell: ({ row }) => {
          const rowIndex = row.index
          return (
            <div className={tableCellFillCenterClass}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => removeRow(rowIndex)}
                aria-label="Remove row"
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ]
  }, [
    costTypeOptions,
    formatMoney,
    handleRowDragStart,
    onUpdateRow,
    removeRow,
    rows.length,
    totals,
    unitListId,
  ])

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnSizing },
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        return next
      })
    },
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      ref={tableFrameRef}
      className={cn(
        "rounded-xl border border-border/60 bg-background dark:bg-input/30 overflow-hidden",
        frameClassName,
      )}
    >
      <Table className="w-full table-fixed text-xs min-w-[1040px]" style={{ width: table.getTotalSize() }}>
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
                          setUserSized(true)
                          resizeHandler(event)
                        }}
                        onTouchStart={(event) => {
                          setUserSized(true)
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
              onDrop={(event) => handleRowDrop(row.index, event)}
              onDragEnd={handleRowDragEnd}
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
    </div>
  )
}
