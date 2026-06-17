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
  layout?: "grid" | "stacked"
  updateValue: (name: string, value: AssignmentValues[string]) => void
}

export function AssignmentBudgetTableField({
  field,
  values,
  isStepper,
  labelClassName,
  labelText,
  layout = "grid",
  updateValue,
}: AssignmentBudgetTableFieldProps) {
  const rawRows = Array.isArray(values[field.name])
    ? (values[field.name] as BudgetTableRow[])
    : (field.rows ?? [])
  const ensureRows = (rawRows.length > 0 ? rawRows : [BLANK_BUDGET_ROW]).map(
    (row) => ({
      category: row.category ?? "",
      description: row.description ?? "",
      costType: row.costType ?? "",
      unit: row.unit ?? "",
      units: row.units ?? "",
      costPerUnit: row.costPerUnit ?? "",
      totalCost: row.totalCost ?? "",
    })
  )
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
    <div className="border-border/60 bg-muted/30 text-muted-foreground flex max-w-full min-w-0 flex-col gap-3 rounded-xl border border-dashed p-4 text-xs">
      <div className="flex items-start gap-3">
        <span className="border-border/60 bg-background/60 text-muted-foreground mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-foreground min-w-0 text-xs font-semibold break-words">
            Program Expense Exercise
          </p>
          <p className="min-w-0 leading-relaxed break-words">
            {field.description}
          </p>
        </div>
      </div>
      <ol className="grid gap-2">
        {BUDGET_GUIDE_STEPS.map((step, index) => (
          <li
            key={`${field.name}-guide-${step.title}`}
            className="flex min-w-0 gap-2"
          >
            <span className="border-border/60 bg-background/60 text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-foreground min-w-0 text-xs font-semibold break-words">
                {step.title}
              </p>
              <p className="text-muted-foreground min-w-0 text-[11px] break-words">
                {step.description}
              </p>
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
        "flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden",
        isStepper && "h-full min-h-0 flex-1"
      )}
    >
      <div className="flex max-w-full min-w-0 flex-col gap-2">
        <Label className={cn(labelClassName, "max-w-full min-w-0 break-words")}>
          {displayLabel}
        </Label>
        {descriptionBlock}
      </div>
      <div className="border-border/60 bg-sidebar max-w-full min-w-0 overflow-x-hidden rounded-xl border p-4 text-xs">
        <div className="flex max-w-full min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Subtotal
            </span>
            <span className="text-foreground max-w-full min-w-0 text-base font-semibold break-words tabular-nums">
              ${formatMoney(subtotal)}
            </span>
            <p className="text-muted-foreground min-w-0 text-[11px] break-words">
              Totals update as you edit units and costs.
            </p>
          </div>
          <div className="grid max-w-full min-w-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full min-w-0"
              onClick={() => addRow()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full min-w-0 gap-2"
            >
              <a href={BUDGET_TEMPLATE_HREF} download>
                <Download className="h-4 w-4" aria-hidden />
                Download
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 max-w-full min-w-0 overflow-x-hidden",
          isStepper && "flex min-h-0 flex-1"
        )}
      >
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
          layout={layout}
          maxBodyHeightClassName={
            layout === "grid" && isStepper
              ? "max-h-[min(56vh,36rem)]"
              : undefined
          }
        />
      </div>
    </div>
  )
}
