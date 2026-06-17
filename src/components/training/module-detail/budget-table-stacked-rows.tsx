"use client"

import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { BudgetTableRow } from "@/lib/modules"

type BudgetTableStackedRowsProps = {
  rows: BudgetTableRow[]
  totals: number[]
  subtotal: number
  costTypeOptions: string[]
  unitOptions: string[]
  unitListId: string
  formatMoney: (value: number) => string
  onUpdateRow: (rowIndex: number, patch: Partial<BudgetTableRow>) => void
  onRemoveRow: (rowIndex: number) => void
}

function fieldId(
  unitListId: string,
  rowIndex: number,
  field: keyof BudgetTableRow
) {
  return `${unitListId}-row-${rowIndex}-${field}`
}

export function BudgetTableStackedRows({
  rows,
  totals,
  subtotal,
  costTypeOptions,
  unitOptions,
  unitListId,
  formatMoney,
  onUpdateRow,
  onRemoveRow,
}: BudgetTableStackedRowsProps) {
  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-3 overflow-x-hidden">
      {rows.map((row, rowIndex) => {
        const rowNumber = rowIndex + 1
        const categoryId = fieldId(unitListId, rowIndex, "category")
        const descriptionId = fieldId(unitListId, rowIndex, "description")
        const costTypeId = fieldId(unitListId, rowIndex, "costType")
        const unitId = fieldId(unitListId, rowIndex, "unit")
        const unitsId = fieldId(unitListId, rowIndex, "units")
        const costPerUnitId = fieldId(unitListId, rowIndex, "costPerUnit")
        const total = totals[rowIndex] ?? 0

        return (
          <section
            key={`${unitListId}-stacked-row-${rowIndex}`}
            aria-label={`Budget line ${rowNumber}`}
            className="border-border/60 bg-background flex w-full max-w-full min-w-0 flex-col gap-3 overflow-x-hidden rounded-xl border p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                  {rowNumber}
                </span>
                <p className="min-w-0 text-sm font-medium break-words">
                  {row.category.trim() || "New line item"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-8 rounded-lg"
                onClick={() => onRemoveRow(rowIndex)}
                aria-label={`Remove budget line ${rowNumber}`}
                disabled={rows.length <= 1}
              >
                <Trash2Icon aria-hidden />
              </Button>
            </div>

            <div className="grid w-full max-w-full min-w-0 gap-3">
              <div className="grid min-w-0 gap-1.5">
                <Label
                  htmlFor={categoryId}
                  className="text-muted-foreground text-xs"
                >
                  Category
                </Label>
                <Input
                  id={categoryId}
                  value={row.category}
                  placeholder="Expense category"
                  onChange={(event) =>
                    onUpdateRow(rowIndex, {
                      category: event.currentTarget.value,
                    })
                  }
                />
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label
                  htmlFor={costTypeId}
                  className="text-muted-foreground text-xs"
                >
                  Cost type
                </Label>
                <Select
                  value={row.costType || undefined}
                  onValueChange={(next) =>
                    onUpdateRow(rowIndex, { costType: next })
                  }
                >
                  <SelectTrigger
                    id={costTypeId}
                    className="w-full max-w-full min-w-0"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {costTypeOptions.map((option) => (
                        <SelectItem
                          key={`budget-cost-type-${option}`}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid min-w-0 gap-1.5">
              <Label
                htmlFor={descriptionId}
                className="text-muted-foreground text-xs"
              >
                Description
              </Label>
              <Textarea
                id={descriptionId}
                value={row.description}
                placeholder="What this pays for"
                rows={2}
                className="min-h-20 max-w-full min-w-0 resize-y"
                onChange={(event) =>
                  onUpdateRow(rowIndex, {
                    description: event.currentTarget.value,
                  })
                }
              />
            </div>

            <div className="grid w-full max-w-full min-w-0 gap-3">
              <div className="grid min-w-0 gap-1.5">
                <Label
                  htmlFor={unitId}
                  className="text-muted-foreground text-xs"
                >
                  Unit
                </Label>
                <Input
                  id={unitId}
                  value={row.unit}
                  placeholder="Unit"
                  list={unitListId}
                  onChange={(event) =>
                    onUpdateRow(rowIndex, { unit: event.currentTarget.value })
                  }
                />
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label
                  htmlFor={unitsId}
                  className="text-muted-foreground text-xs"
                >
                  Qty
                </Label>
                <Input
                  id={unitsId}
                  value={row.units}
                  placeholder="0"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  className="tabular-nums"
                  onChange={(event) =>
                    onUpdateRow(rowIndex, {
                      units: event.currentTarget.value,
                    })
                  }
                />
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label
                  htmlFor={costPerUnitId}
                  className="text-muted-foreground text-xs"
                >
                  Cost / unit
                </Label>
                <div className="relative min-w-0">
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                  <Input
                    id={costPerUnitId}
                    value={row.costPerUnit}
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    className="pl-7 tabular-nums"
                    onChange={(event) =>
                      onUpdateRow(rowIndex, {
                        costPerUnit: event.currentTarget.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid min-w-0 gap-1.5">
                <Label className="text-muted-foreground text-xs">Total</Label>
                <div className="border-border/60 bg-muted/35 flex h-9 max-w-full min-w-0 items-center justify-end overflow-hidden rounded-md border px-3 text-sm font-semibold tabular-nums">
                  ${formatMoney(total)}
                </div>
              </div>
            </div>
          </section>
        )
      })}

      <div className="border-border/60 bg-muted/35 flex min-w-0 flex-col gap-1 rounded-xl border px-3 py-2">
        <span className="text-muted-foreground text-xs font-medium">
          Subtotal
        </span>
        <span className="max-w-full min-w-0 text-sm font-semibold break-words tabular-nums">
          ${formatMoney(subtotal)}
        </span>
      </div>

      <datalist id={unitListId}>
        {unitOptions.map((option) => (
          <option key={`budget-unit-option-${option}`} value={option} />
        ))}
      </datalist>
    </div>
  )
}
