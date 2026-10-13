import Download from "lucide-react/dist/esm/icons/download"
import Info from "lucide-react/dist/esm/icons/info"
import Plus from "lucide-react/dist/esm/icons/plus"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BudgetTable } from "../budget-table"
import type { BudgetTableRow, ModuleAssignmentField } from "../../types"
import type { AssignmentValues } from "../utils"
import { cn } from "@/lib/utils"

const COST_TYPE_OPTIONS = ["Fixed", "Variable", "Fixed or Variable"]
const UNIT_OPTIONS = [
  "Session / Hour",
  "Participant / Session",
  "Participant / Event",
  "Event / Month",
  "Participant / Trip",
  "Program / Participant",
  "Program / Session",
]
const BUDGET_TEMPLATE_HREF = "/templates/budget-template.csv"
const BUDGET_GUIDE_STEPS = [
  {
    title: "List line items",
    description: "Add each expense category you expect to fund.",
  },
  {
    title: "Add units and costs",
    description: "Choose fixed or variable and fill in the math.",
  },
  {
    title: "Review your subtotal",
    description: "Totals auto-calc so you can iterate quickly.",
  },
]

const BLANK_BUDGET_ROW: BudgetTableRow = {
  category: "",
  description: "",
  costType: "",
  unit: "",
  units: "",
  costPerUnit: "",
  totalCost: "",
}

function parseNumber(value: string) {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}

function computeBudgetRowTotal(row: BudgetTableRow) {
  return parseNumber(row.units) * parseNumber(row.costPerUnit)
}

type AssignmentBudgetTableFieldProps = {
  field: ModuleAssignmentField
  values: AssignmentValues
  isStepper: boolean
  labelClassName: string
  labelText: string
  updateValue: (name: string, value: AssignmentValues[string]) => void
}

export function AssignmentBudgetTableField({
  field,
  values,
  isStepper,
  labelClassName,
  labelText,
  updateValue,
}: AssignmentBudgetTableFieldProps) {
  const rawRows = Array.isArray(values[field.name])
    ? (values[field.name] as BudgetTableRow[])
    : field.rows ?? []
  const ensureRows = (rawRows.length > 0 ? rawRows : [BLANK_BUDGET_ROW]).map((row) => ({
    category: row.category ?? "",
    description: row.description ?? "",
    costType: row.costType ?? "",
    unit: row.unit ?? "",
    units: row.units ?? "",
    costPerUnit: row.costPerUnit ?? "",
    totalCost: row.totalCost ?? "",
  }))
  const unitListId = `${field.name}-unit-options`
  const totals = ensureRows.map((row) => computeBudgetRowTotal(row))
  const subtotal = totals.reduce((sum, value) => sum + value, 0)
  const formattedLabel = (field.label ?? "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const displayLabel = formattedLabel
    ? formattedLabel.replace(/\b\w/g, (char) => char.toUpperCase())
    : labelText
  const descriptionBlock = field.description ? (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Program Expense Exercise</p>
          <p className="leading-relaxed">{field.description}</p>
        </div>
      </div>
      <ol className="grid gap-2">
        {BUDGET_GUIDE_STEPS.map((step, index) => (
          <li key={`${field.name}-guide-${step.title}`} className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60 text-[11px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">{step.title}</p>
              <p className="text-[11px] text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  ) : null

  const addRow = (seed?: Partial<BudgetTableRow>) => {
    updateValue(field.name, [...ensureRows, { ...BLANK_BUDGET_ROW, ...seed }])
  }

  const updateRow = (rowIndex: number, patch: Partial<BudgetTableRow>) => {
    const nextRows = [...ensureRows]
    const nextRow = { ...nextRows[rowIndex], ...patch }
    nextRow.totalCost = formatMoney(computeBudgetRowTotal(nextRow))
    nextRows[rowIndex] = nextRow
    updateValue(field.name, nextRows)
  }

  return (
    <div
      className={cn(
        "min-w-0 space-y-4",
        isStepper && "flex h-full min-h-0 flex-1 flex-col space-y-4",
      )}
    >
      <div className="space-y-2">
        <Label className={labelClassName}>{displayLabel}</Label>
        {descriptionBlock}
      </div>
      <div className="rounded-xl border border-border/60 bg-sidebar p-4 text-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Subtotal
            </span>
            <span className="text-base font-semibold tabular-nums text-foreground">
              ${formatMoney(subtotal)}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Totals update as you edit units and costs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => addRow()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto gap-2">
              <a href={BUDGET_TEMPLATE_HREF} download>
                <Download className="h-4 w-4" aria-hidden />
                Download
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("min-h-0", isStepper && "flex min-h-0 flex-1")}>
        <BudgetTable
          rows={ensureRows}
          blankRow={BLANK_BUDGET_ROW}
          totals={totals}
          subtotal={subtotal}
          costTypeOptions={COST_TYPE_OPTIONS}
          unitOptions={UNIT_OPTIONS}
          unitListId={unitListId}
          formatMoney={formatMoney}
          onUpdateRow={updateRow}
          onRowsChange={(nextRows) => updateValue(field.name, nextRows)}
          maxBodyHeightClassName={isStepper ? "max-h-[min(56vh,36rem)]" : undefined}
        />
      </div>
    </div>
  )
}
