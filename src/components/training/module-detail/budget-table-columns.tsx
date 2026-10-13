import type { DragEvent } from "react"
import type { ColumnDef, ColumnSizingState } from "@tanstack/react-table"
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { BudgetTableRow } from "@/lib/modules"
import { COLUMN_DEFAULTS, COLUMN_MINS, COLUMN_ORDER, HEADER_LABELS } from "./budget-table-column-config"

export const BUDGET_TABLE_CELL_CLASSES = {
  tableCellClass: "relative min-h-11 p-0 align-middle whitespace-normal break-words bg-transparent",
  tableCellFillClass: "absolute inset-0 flex h-full w-full items-center bg-transparent dark:bg-transparent",
  tableCellFillStretchClass: "flex h-full w-full items-stretch bg-transparent dark:bg-transparent",
  tableCellFillCenterClass:
    "absolute inset-0 flex h-full w-full items-center justify-center bg-transparent dark:bg-transparent",
  tableInputClass:
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-2 text-xs shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0",
  tableSelectClass:
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-0 text-xs shadow-none focus:border-border/60 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-[size=default]:h-full",
  tableNumberClass:
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 text-right text-xs tabular-nums shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0",
  tableMoneyClass:
    "h-full min-h-11 w-full min-w-0 rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent pl-6 pr-2 text-right text-xs tabular-nums shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0",
  tableTextareaClass:
    "min-h-11 h-full w-full min-w-0 resize-none overflow-hidden rounded-none border-0 border-b border-transparent bg-transparent dark:bg-transparent px-2 py-2 text-xs leading-snug shadow-none focus-visible:border-border/60 focus-visible:outline-none focus-visible:ring-0",
} as const

export function fitBudgetTableColumnSizes(containerWidth: number): ColumnSizingState {
  if (!containerWidth || containerWidth <= 0) {
    return Object.fromEntries(COLUMN_ORDER.map((id) => [id, COLUMN_MINS[id]])) as ColumnSizingState
  }

  const minTotal = COLUMN_ORDER.reduce((sum, id) => sum + COLUMN_MINS[id], 0)
  if (containerWidth <= minTotal) {
    return Object.fromEntries(COLUMN_ORDER.map((id) => [id, COLUMN_MINS[id]])) as ColumnSizingState
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

type BuildBudgetTableColumnsArgs = {
  costTypeOptions: string[]
  unitListId: string
  totals: number[]
  formatMoney: (value: number) => string
  rowsLength: number
  onUpdateRow: (rowIndex: number, patch: Partial<BudgetTableRow>) => void
  onRemoveRow: (rowIndex: number) => void
  onRowDragStart: (rowIndex: number, event: DragEvent<HTMLButtonElement>) => void
}

export function buildBudgetTableColumns({
  costTypeOptions,
  unitListId,
  totals,
  formatMoney,
  rowsLength,
  onUpdateRow,
  onRemoveRow,
  onRowDragStart,
}: BuildBudgetTableColumnsArgs): ColumnDef<BudgetTableRow>[] {
  return [
    {
      id: "category",
      header: HEADER_LABELS.category,
      size: COLUMN_DEFAULTS.category,
      minSize: COLUMN_MINS.category,
      cell: ({ row }) => {
        const rowIndex = row.index
        return (
          <div className={cn(BUDGET_TABLE_CELL_CLASSES.tableCellFillClass, "gap-2 px-2")}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-full w-6 cursor-grab text-muted-foreground hover:text-foreground"
              draggable
              onDragStart={(event) => onRowDragStart(rowIndex, event)}
              aria-label="Reorder row"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Input
              value={row.original.category}
              placeholder="Expense category"
              className={BUDGET_TABLE_CELL_CLASSES.tableInputClass}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillStretchClass}>
            <Textarea
              value={row.original.description}
              placeholder="Description"
              rows={1}
              className={BUDGET_TABLE_CELL_CLASSES.tableTextareaClass}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillClass}>
            <Select
              value={row.original.costType || undefined}
              onValueChange={(next) => onUpdateRow(rowIndex, { costType: next })}
            >
              <SelectTrigger className={BUDGET_TABLE_CELL_CLASSES.tableSelectClass}>
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillClass}>
            <Input
              value={row.original.unit}
              placeholder="Unit"
              list={unitListId}
              className={BUDGET_TABLE_CELL_CLASSES.tableInputClass}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillClass}>
            <Input
              value={row.original.units}
              placeholder="0"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className={BUDGET_TABLE_CELL_CLASSES.tableNumberClass}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillClass}>
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
                className={BUDGET_TABLE_CELL_CLASSES.tableMoneyClass}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillClass}>
            <div className="relative h-full w-full min-w-0">
              <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                $
              </span>
              <Input
                value={formatMoney(total)}
                readOnly
                className={cn(BUDGET_TABLE_CELL_CLASSES.tableMoneyClass, "font-semibold")}
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
          <div className={BUDGET_TABLE_CELL_CLASSES.tableCellFillCenterClass}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onRemoveRow(rowIndex)}
              aria-label="Remove row"
              disabled={rowsLength <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
