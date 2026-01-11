import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Plus from "lucide-react/dist/esm/icons/plus"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import type { ModuleAssignmentField, BudgetTableRow } from "../types"
import { buildAssignmentSections } from "./assignment-sections"
import {
  assignmentValuesEqual,
  buildAssignmentValues,
  normalizeOptions,
  type AssignmentValues,
} from "./utils"

const RichTextEditorLazy = dynamic(
  () => import("@/components/rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[160px] rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
)

type AssignmentFormProps = {
  fields: ModuleAssignmentField[]
  initialValues: AssignmentValues
  pending: boolean
  onSubmit: (values: AssignmentValues, options?: { silent?: boolean }) => void
  mode?: "standard" | "stepper"
  activeSectionId?: string
  statusLabel?: string | null
  statusVariant?: "default" | "secondary" | "destructive" | "outline"
  helperText?: string | null
  errorMessage?: string | null
  updatedAt?: string | null
  completeOnSubmit: boolean
  statusNote?: string | null
  moduleId: string
  moduleTitle: string
  classTitle: string
  nextHref?: string | null
  currentStep?: number
  totalSteps?: number
  headerSlot?: React.ReactNode
  progressPlacement?: "sidebar" | "header"
}

type TabStepStatus = "not_started" | "in_progress" | "complete"

const BUDGET_COLUMN_DEFAULTS = [200, 300, 150, 150, 100, 130, 170]
const BUDGET_COLUMN_MINS = [150, 210, 120, 110, 80, 100, 120]

function TabStepBadge({ status, label }: { status: TabStepStatus; label: number }) {
  const styles =
    status === "complete"
      ? {
          border: "border-emerald-500",
          text: "text-emerald-500",
          icon: <CheckIcon className="h-3 w-3" />,
          dashed: false,
        }
      : status === "in_progress"
        ? {
            border: "border-amber-500",
            text: "text-amber-500",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: true,
          }
        : {
            border: "border-muted-foreground/60",
            text: "text-muted-foreground",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: false,
          }

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-sidebar",
        styles.border,
      )}
      style={{ borderStyle: styles.dashed ? "dashed" : "solid" }}
    >
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-center leading-none", styles.text)}>
        {styles.icon}
      </span>
    </span>
  )
}

export function AssignmentForm(props: AssignmentFormProps) {
  if (props.fields.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Homework</CardTitle>
          <CardDescription>No assignment data yet — check back soon.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <AssignmentFormInner {...props} />
}

function AssignmentFormInner({
  fields,
  initialValues,
  pending,
  onSubmit,
  mode = "standard",
  activeSectionId,
  statusLabel,
  statusVariant = "outline",
  helperText,
  errorMessage,
  completeOnSubmit,
  statusNote,
  moduleId,
  moduleTitle,
  classTitle,
  nextHref = null,
  currentStep,
  totalSteps,
  headerSlot,
  progressPlacement = "sidebar",
}: AssignmentFormProps) {
  const isStepper = mode === "stepper"
  const [values, setValues] = useState<AssignmentValues>(initialValues)
  const [activeAssistField, setActiveAssistField] = useState<string | null>(null)
  const [isAssistPending, startAssistTransition] = useTransition()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const showStatusBadge = statusLabel && statusLabel !== "Submitted"
  const hasMeta = Boolean(showStatusBadge || helperText || errorMessage || statusNote || autoSaving)
  const [budgetColumnWidths, setBudgetColumnWidths] = useState<number[]>(BUDGET_COLUMN_DEFAULTS)
  const [budgetUserSized, setBudgetUserSized] = useState(false)
  const budgetResizeRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null)
  const budgetTableRef = useRef<HTMLDivElement | null>(null)
  const [draggingRow, setDraggingRow] = useState<number | null>(null)

  const fitBudgetColumns = useCallback((containerWidth: number) => {
    if (!containerWidth || containerWidth <= 0) return BUDGET_COLUMN_DEFAULTS
    const target = containerWidth
    const minTotal = BUDGET_COLUMN_MINS.reduce((sum, value) => sum + value, 0)
    if (target <= minTotal) {
      return [...BUDGET_COLUMN_MINS]
    }
    const base = BUDGET_COLUMN_DEFAULTS
    const widths = new Array(base.length).fill(0) as number[]
    let remaining = target
    let remainingIndexes = base.map((_, index) => index)
    let guard = 0

    while (remainingIndexes.length > 0 && guard < 8) {
      guard += 1
      const baseSum = remainingIndexes.reduce((sum, idx) => sum + base[idx], 0)
      if (baseSum <= 0) break
      let changed = false
      remainingIndexes = remainingIndexes.filter((idx) => {
        const scaled = Math.floor((base[idx] / baseSum) * remaining)
        if (scaled < BUDGET_COLUMN_MINS[idx]) {
          widths[idx] = BUDGET_COLUMN_MINS[idx]
          remaining -= widths[idx]
          changed = true
          return false
        }
        return true
      })
      if (!changed) {
        remainingIndexes.forEach((idx) => {
          widths[idx] = Math.max(
            BUDGET_COLUMN_MINS[idx],
            Math.floor((base[idx] / baseSum) * remaining),
          )
        })
        break
      }
      if (remaining <= 0) break
    }

    return widths.map((value, idx) => Math.max(BUDGET_COLUMN_MINS[idx], value || BUDGET_COLUMN_MINS[idx]))
  }, [])

  useEffect(() => {
    setValues((prev) => (assignmentValuesEqual(prev, initialValues) ? prev : initialValues))
  }, [initialValues])

  // Restore autosaved draft if present
  useEffect(() => {
    if (typeof window === "undefined") return
    const key = `assignment-autosave-${moduleId}`
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as { values?: AssignmentValues }
      if (!parsed?.values) return
      const nextValues = parsed.values as AssignmentValues
      setValues((prev) => (assignmentValuesEqual(nextValues, prev) ? prev : nextValues))
    } catch {
      // ignore
    }
  }, [moduleId])

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!budgetResizeRef.current) return
      const { index, startX, startWidth } = budgetResizeRef.current
      const delta = event.clientX - startX
      const minWidth = BUDGET_COLUMN_MINS[index] ?? 120
      setBudgetColumnWidths((prev) => {
        const next = [...prev]
        next[index] = Math.max(minWidth, startWidth + delta)
        return next
      })
    }
    const handleUp = () => {
      if (!budgetResizeRef.current) return
      budgetResizeRef.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [])

  useEffect(() => {
    if (budgetUserSized) return
    const node = budgetTableRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const update = () => {
      const width = node.clientWidth
      if (!width) return
      setBudgetColumnWidths(fitBudgetColumns(width))
    }
    update()
    const observer = new ResizeObserver(() => update())
    observer.observe(node)
    return () => observer.disconnect()
  }, [budgetUserSized, fitBudgetColumns])

  const updateValue = useCallback((name: string, value: AssignmentValues[string]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(values)
  }, [onSubmit, values])

  const startBudgetResize = useCallback(
    (index: number, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setBudgetUserSized(true)
      budgetResizeRef.current = {
        index,
        startX: event.clientX,
        startWidth: budgetColumnWidths[index] ?? BUDGET_COLUMN_DEFAULTS[index] ?? 160,
      }
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [budgetColumnWidths],
  )

  const handleAssist = useCallback(
    (field: ModuleAssignmentField) => {
      if (!moduleId) return
      const current = (values[field.name] as string) ?? ""
      setActiveAssistField(field.name)
      startAssistTransition(async () => {
        try {
          const response = await fetch("/api/homework/assist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleId,
              fieldName: field.name,
              fieldLabel: field.label,
              promptContext: field.assistContext ?? field.orgKey ?? field.name,
              classTitle,
              moduleTitle,
              currentAnswer: current,
            }),
          })
          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string }
            toast.error(payload?.error ?? "Unable to generate suggestion")
            return
          }
          const payload = (await response.json()) as { suggestion?: string }
          if (!payload?.suggestion) {
            toast.error("Assist tool returned an empty draft")
            return
          }
          updateValue(field.name, payload.suggestion)
          toast.success("Draft inserted — edit before submitting")
        } catch (error) {
          console.error(error)
          toast.error("Assist tool is unavailable right now")
        } finally {
          setActiveAssistField(null)
        }
      })
    },
    [classTitle, moduleId, moduleTitle, updateValue, values],
  )

  const renderField = useCallback(
    (field: ModuleAssignmentField, options?: { hideLabel?: boolean; hideAssist?: boolean }) => {
      const hideLabel = Boolean(options?.hideLabel)
      const hideAssist = Boolean(options?.hideAssist)
      const labelText = field.required ? `${field.label} *` : field.label
      const labelClassName = cn(
        "text-base font-semibold leading-tight select-text",
        hideLabel && "sr-only",
      )
      const description = field.description ? (
        <p className="text-xs text-muted-foreground whitespace-pre-line">{field.description}</p>
      ) : null
      const fieldId = field.name

      switch (field.type) {
        case "short_text":
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={fieldId} className={labelClassName}>
                {labelText}
              </Label>
              {description}
              <Input
                id={fieldId}
                value={(values[field.name] as string) ?? ""}
                placeholder={field.placeholder}
                required={field.required}
                onChange={(event) => updateValue(field.name, event.target.value)}
              />
            </div>
          )
        case "long_text":
          return (
            <div key={field.name} className="space-y-3">
              <Label
                htmlFor={fieldId}
                className={cn(labelClassName, "w-full")}
              >
                {labelText}
              </Label>
              {field.description ? (
                <p className="text-left text-xs text-muted-foreground whitespace-pre-line">{field.description}</p>
              ) : null}
              <RichTextEditorLazy
                value={(values[field.name] as string) ?? ""}
                onChange={(next) => updateValue(field.name, next)}
                placeholder={field.placeholder}
                mode="homework"
                toolbarActions={
                  !hideAssist && moduleId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssist(field)}
                      disabled={isAssistPending && activeAssistField === field.name}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      {isAssistPending && activeAssistField === field.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Assist
                    </Button>
                  ) : null
                }
              />
            </div>
          )
        case "select": {
          const normalizedOptions = normalizeOptions(field.options ?? [])
          return (
            <div key={field.name} className="space-y-2">
              <Label className={labelClassName}>{labelText}</Label>
              {description}
              <Select
                value={(values[field.name] as string) ?? ""}
                onValueChange={(next) => updateValue(field.name, next)}
                disabled={normalizedOptions.length === 0}
              >
                <SelectTrigger id={fieldId} aria-required={field.required}>
                  <SelectValue placeholder={field.placeholder ?? "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {normalizedOptions.map((option) => (
                    <SelectItem key={option.key} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {normalizedOptions.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">No options configured.</p> : null}
            </div>
          )
        }
        case "multi_select": {
          const normalizedOptions = normalizeOptions(field.options ?? [])
          return (
            <div key={field.name} className="space-y-2">
              <Label className={labelClassName}>{labelText}</Label>
              {description}
              <div className="space-y-2">
                {normalizedOptions.map((option) => {
                  const selected = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : []
                  const checked = selected.includes(option.value)
                  return (
                    <label key={option.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const current = Array.isArray(values[field.name]) ? [...(values[field.name] as string[])] : []
                          const isChecked = next === true
                          if (isChecked && !current.includes(option.value)) {
                            current.push(option.value)
                          }
                          if (!isChecked) {
                            const index = current.indexOf(option.value)
                            if (index >= 0) current.splice(index, 1)
                          }
                          updateValue(field.name, current)
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
                {normalizedOptions.length === 0 ? <p className="text-xs text-muted-foreground">No options configured.</p> : null}
              </div>
            </div>
          )
        }
        case "budget_table": {
          const rawRows = Array.isArray(values[field.name])
            ? (values[field.name] as BudgetTableRow[])
            : field.rows ?? []
          const blankRow: BudgetTableRow = {
            category: "",
            description: "",
            costType: "",
            unit: "",
            units: "",
            costPerUnit: "",
            totalCost: "",
          }
          const ensureRows = (rawRows.length > 0 ? rawRows : [blankRow]).map((row) => ({
            category: row.category ?? "",
            description: row.description ?? "",
            costType: row.costType ?? "",
            unit: row.unit ?? "",
            units: row.units ?? "",
            costPerUnit: row.costPerUnit ?? "",
            totalCost: row.totalCost ?? "",
          }))
          const costTypeOptions = ["Fixed", "Variable", "Fixed or Variable"]
          const parseNumber = (value: string) => {
            if (!value) return 0
            const cleaned = value.replace(/[^0-9.-]/g, "")
            const parsed = Number.parseFloat(cleaned)
            return Number.isFinite(parsed) ? parsed : 0
          }
          const formatMoney = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : "0.00")
          const computeTotal = (row: BudgetTableRow) => {
            const units = parseNumber(row.units)
            const cost = parseNumber(row.costPerUnit)
            return units * cost
          }
          const totals = ensureRows.map((row) => computeTotal(row))
          const subtotal = totals.reduce((sum, value) => sum + value, 0)
          const formattedLabel = (field.label ?? "")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          const displayLabel = formattedLabel
            ? formattedLabel.replace(/\b\w/g, (char) => char.toUpperCase())
            : labelText
          const descriptionBlock = field.description ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
              {field.description}
            </div>
          ) : null
          const tableInputClass =
            "h-8 w-full min-w-0 rounded-md border border-border/60 bg-background/80 px-2 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
          const tableSelectClass =
            "h-8 w-full min-w-0 rounded-md border border-border/60 bg-background/80 px-2 text-xs shadow-none focus:ring-1 focus:ring-ring focus:ring-offset-0"
          const tableNumberClass =
            "h-8 w-full min-w-0 rounded-md border border-border/60 bg-background/80 px-2 text-right text-xs tabular-nums shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
          const tableMoneyClass =
            "h-8 w-full min-w-0 rounded-md border border-border/60 bg-background/80 pl-4 pr-2 text-right text-xs tabular-nums shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
          const tableTextareaClass =
            "min-h-8 w-full min-w-0 resize-none rounded-md border border-border/60 bg-background/80 px-2 py-1.5 text-xs leading-snug shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"

          const moveRow = (fromIndex: number, toIndex: number) => {
            if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
            const nextRows = [...ensureRows]
            const [moved] = nextRows.splice(fromIndex, 1)
            nextRows.splice(toIndex, 0, moved)
            updateValue(field.name, nextRows)
          }

          const handleRowDragStart = (rowIndex: number, event: React.DragEvent<HTMLButtonElement>) => {
            setDraggingRow(rowIndex)
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData("text/plain", String(rowIndex))
          }

          const handleRowDrop = (rowIndex: number, event: React.DragEvent<HTMLTableRowElement>) => {
            event.preventDefault()
            const payload = event.dataTransfer.getData("text/plain")
            const fromIndex = Number.parseInt(payload, 10)
            if (Number.isNaN(fromIndex)) {
              setDraggingRow(null)
              return
            }
            moveRow(fromIndex, rowIndex)
            setDraggingRow(null)
          }

          const handleRowDragEnd = () => {
            setDraggingRow(null)
          }

          const updateRow = (rowIndex: number, patch: Partial<BudgetTableRow>) => {
            const nextRows = [...ensureRows]
            const nextRow = { ...nextRows[rowIndex], ...patch }
            nextRow.totalCost = formatMoney(computeTotal(nextRow))
            nextRows[rowIndex] = nextRow
            updateValue(field.name, nextRows)
          }

          return (
            <div key={field.name} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="max-w-2xl space-y-2">
                  <Label className={labelClassName}>{displayLabel}</Label>
                  {descriptionBlock}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1">
                    Auto-calculated
                  </span>
                  <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-1 font-semibold text-foreground">
                    Subtotal ${formatMoney(subtotal)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateValue(field.name, [...ensureRows, blankRow])}
                    aria-label="Add row"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div
                ref={budgetTableRef}
                className="rounded-xl border border-border/60 bg-card/70 overflow-hidden w-full max-w-none sm:-mx-4 sm:w-[calc(100%+2rem)] lg:-mx-8 lg:w-[calc(100%+4rem)] 2xl:-mx-12 2xl:w-[calc(100%+6rem)]"
              >
                <Table className="w-full table-fixed text-xs">
                  <colgroup>
                    {budgetColumnWidths.map((width, index) => (
                      <col key={`${field.name}-col-${index}`} style={{ width: `${width}px` }} />
                    ))}
                  </colgroup>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/60">
                      {[
                        "Expense Category",
                        "Description / What This Covers",
                        "Cost Type",
                        "Unit (if variable)",
                        "# of Units",
                        "Cost per Unit",
                        "Total Estimated Cost",
                      ].map((label, index) => {
                        return (
                          <TableHead
                            key={`${field.name}-head-${index}`}
                            className={cn(
                              "relative h-auto py-2 text-[11px] font-semibold text-muted-foreground align-middle whitespace-normal leading-snug",
                              index > 0 ? "border-l border-border/40" : "",
                              index === 6 ? "text-right" : "",
                            )}
                          >
                            <span>{label}</span>
                            <div
                              role="separator"
                              aria-orientation="vertical"
                              className={cn(
                                "absolute right-0 top-0 h-full w-2 cursor-col-resize",
                                index === 6 && "hidden",
                              )}
                              onMouseDown={(event) => startBudgetResize(index, event)}
                            />
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ensureRows.map((row, rowIndex) => (
                      <TableRow
                        key={`${field.name}-row-${rowIndex}`}
                        className={cn("hover:bg-muted/30", draggingRow === rowIndex && "opacity-70")}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleRowDrop(rowIndex, event)}
                        onDragEnd={handleRowDragEnd}
                      >
                        <TableCell className="px-2 py-1.5 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="cursor-grab text-muted-foreground hover:text-foreground"
                              draggable
                              onDragStart={(event) => handleRowDragStart(rowIndex, event)}
                              aria-label="Reorder row"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <Input
                              value={row.category}
                              placeholder="Expense category"
                              className={tableInputClass}
                              onChange={(event) => updateRow(rowIndex, { category: event.currentTarget.value })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40 whitespace-normal">
                          <Textarea
                            value={row.description}
                            placeholder="Description"
                            rows={1}
                            className={tableTextareaClass}
                            onChange={(event) => updateRow(rowIndex, { description: event.currentTarget.value })}
                            onInput={(event) => {
                              const target = event.currentTarget
                              target.style.height = "auto"
                              target.style.height = `${target.scrollHeight}px`
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40">
                          <Select
                            value={row.costType || undefined}
                            onValueChange={(next) => updateRow(rowIndex, { costType: next })}
                          >
                            <SelectTrigger className={tableSelectClass}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {costTypeOptions.map((option) => (
                                <SelectItem key={`${field.name}-${rowIndex}-${option}`} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40">
                          <Input
                            value={row.unit}
                            placeholder="Unit"
                            className={tableInputClass}
                            onChange={(event) => updateRow(rowIndex, { unit: event.currentTarget.value })}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40">
                          <Input
                            value={row.units}
                            placeholder="0"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            className={tableNumberClass}
                            onChange={(event) => updateRow(rowIndex, { units: event.currentTarget.value })}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40">
                          <div className="relative w-full min-w-0">
                            <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              $
                            </span>
                            <Input
                              value={row.costPerUnit}
                              placeholder="0.00"
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              className={tableMoneyClass}
                              onChange={(event) => updateRow(rowIndex, { costPerUnit: event.currentTarget.value })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 align-top border-l border-border/40">
                          <div className="relative w-full min-w-0">
                            <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              $
                            </span>
                            <Input
                              value={formatMoney(totals[rowIndex] ?? 0)}
                              readOnly
                              className={cn(tableMoneyClass, "font-semibold")}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={6}
                        className="px-2 py-2 text-[11px] font-medium uppercase text-muted-foreground rounded-bl-xl"
                      >
                        <span className="sr-only">Subtotal: direct costs</span>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right text-xs font-semibold tabular-nums sticky right-0 z-10 border-l border-border/60 bg-transparent rounded-br-xl">
                        ${formatMoney(subtotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          )
        }
        case "slider": {
          const sliderValue = typeof values[field.name] === "number" ? (values[field.name] as number) : field.min ?? 0
          const min = field.min ?? 0
          const max = field.max ?? min + 100
          const step = field.step ?? 1
          return (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  className={cn(
                    "text-sm font-medium leading-tight select-text",
                    hideLabel && "sr-only",
                  )}
                >
                  {labelText}
                </Label>
                <span className="text-xs text-muted-foreground">{sliderValue}</span>
              </div>
              {description}
              <Slider value={[sliderValue]} min={min} max={max} step={step} onValueChange={(next) => updateValue(field.name, next[0] ?? min)} />
            </div>
          )
        }
        case "custom_program":
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={fieldId} className={labelClassName}>
                {labelText}
              </Label>
              {description}
              {field.programTemplate ? (
                <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                  {field.programTemplate}
                </p>
              ) : null}
              <RichTextEditorLazy
                value={(values[field.name] as string) ?? ""}
                onChange={(next) => updateValue(field.name, next)}
                placeholder={field.placeholder ?? "Outline your plan"}
                mode="homework"
                toolbarActions={
                  !hideAssist && moduleId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssist(field)}
                      disabled={isAssistPending && activeAssistField === field.name}
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      {isAssistPending && activeAssistField === field.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Assist
                    </Button>
                  ) : null
                }
              />
            </div>
          )
        default:
          return null
      }
    },
    [
      activeAssistField,
      budgetColumnWidths,
      draggingRow,
      handleAssist,
      isAssistPending,
      moduleId,
      startBudgetResize,
      updateValue,
      values,
    ],
  )

  const { baseSections, tabSections } = useMemo(() => buildAssignmentSections(fields), [fields])

  const shouldUseTabs = !isStepper && tabSections.length > 1
  const inlineTabTitles = useMemo(() => {
    return tabSections.map((section) => (section.title ?? "").trim().toLowerCase())
  }, [tabSections])
  const useInlineTabs = shouldUseTabs && inlineTabTitles.join("|") === "if|then|so"
  const [activeSection, setActiveSection] = useState<string>(tabSections[0]?.id ?? "section-0")
  const activeSectionKey = isStepper
    ? activeSectionId ?? tabSections[0]?.id ?? "section-0"
    : activeSection

  useEffect(() => {
    if (isStepper) return
    setActiveSection((prev) =>
      tabSections.some((s) => s.id === prev) ? prev : tabSections[0]?.id ?? "section-0",
    )
  }, [isStepper, tabSections])

  useLayoutEffect(() => {
    if (isStepper) return
    const idx = tabSections.findIndex((tab) => tab.id === activeSection)
    const el = tabRefs.current[idx]
    if (el) {
      const { offsetTop, offsetHeight } = el
      setIndicator({ top: offsetTop, height: offsetHeight })
    }
  }, [activeSection, isStepper, tabSections])

  const fieldAnswered = useCallback(
    (field: ModuleAssignmentField) => {
      const value = values[field.name]
      if (value === null || value === undefined) return false
      if (typeof value === "string") return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === "number") return true
      return Boolean(value)
    },
    [values],
  )

  const activeInlineField = useMemo(() => {
    if (!useInlineTabs) return null
    const active = tabSections.find((section) => section.id === activeSectionKey) ?? tabSections[0]
    return active?.fields[0] ?? null
  }, [activeSectionKey, tabSections, useInlineTabs])

  const inlineActiveIndex = useMemo(() => {
    if (!useInlineTabs) return -1
    return tabSections.findIndex((section) => section.id === activeSectionKey)
  }, [activeSectionKey, tabSections, useInlineTabs])

  const overall = useMemo(() => {
    let total = 0
    let answered = 0
    tabSections.forEach((section) => {
      section.fields.forEach((field) => {
        total += 1
        if (fieldAnswered(field)) answered += 1
      })
    })
    return { total, answered, percent: total > 0 ? Math.round((answered / total) * 100) : 0 }
  }, [fieldAnswered, tabSections])
  const showProgressPanel = !isStepper && overall.total > 1

  // Persist drafts locally and auto-save to server
  useEffect(() => {
    if (typeof window === "undefined") return
    const key = `assignment-autosave-${moduleId}`
    try {
      window.localStorage.setItem(key, JSON.stringify({ values }))
    } catch {
      // ignore storage errors
    }
    if (assignmentValuesEqual(values, initialValues)) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      setAutoSaving(false)
      return
    }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaving(true)
      Promise.resolve(onSubmit(values, { silent: true }))
        .catch((err) => {
          console.error("Autosave failed", err)
        })
        .finally(() => setAutoSaving(false))
    }, 2000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [moduleId, onSubmit, values, initialValues])

  const progressPanel = (
    <div className="w-full rounded-2xl border border-border/60 bg-card/70 px-4 pb-4 pt-3 self-start overflow-hidden">
      <div className="border-b border-border/60 px-0 pb-2 pt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Progress</p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${overall.percent}%` }}
            aria-label={`Progress ${overall.percent}%`}
          />
        </div>
      </div>
      <div className="pt-3">
        <Badge variant="secondary" className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          {overall.answered} of {overall.total} completed
        </Badge>
      </div>
      {!useInlineTabs ? (
        <Tabs
          value={activeSection}
          onValueChange={setActiveSection}
          className="flex flex-col gap-3"
        >
          <TabsList className="relative flex w-full flex-col items-stretch gap-2 bg-transparent p-0 pl-2.5 pr-0 pt-3">
            {tabSections.map((section, idx) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                ref={(el) => {
                  tabRefs.current[idx] = el
                }}
                className="relative z-10 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition hover:bg-accent/60 data-[state=active]:bg-accent/70 data-[state=active]:text-foreground"
              >
                <span className="min-w-0 flex-1 whitespace-normal break-words select-text pr-2 text-sm leading-snug">
                  {section.title ?? `Step ${idx + 1}`}
                </span>
                {(() => {
                  const total = section.fields.length
                  const answered = section.fields.reduce((acc, field) => acc + (fieldAnswered(field) ? 1 : 0), 0)
                  const complete = total > 0 && answered === total
                  const inProgress = answered > 0 && !complete
                  const badgeClass = complete
                    ? "text-emerald-500"
                    : inProgress
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  return complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Complete" />
                  ) : (
                    <span className={`shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-semibold leading-none ${badgeClass}`}>
                      {answered} of {total || 0}
                    </span>
                  )
                })()}
              </TabsTrigger>
            ))}
            <motion.div
              className="bg-primary absolute left-0.5 top-2 z-0 w-0.5 rounded-full"
              layout
              style={{ top: indicator.top + 2, height: Math.max(0, indicator.height - 4) }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  )

  const containerClass = isStepper
    ? "space-y-6"
    : progressPlacement === "header" || !showProgressPanel
      ? "space-y-6"
      : "grid items-start gap-6 md:grid-cols-[minmax(260px,_320px)_minmax(0,_1fr)]"

  return (
    <div className={containerClass}>
      {!isStepper && progressPlacement === "header" ? (
        headerSlot || showProgressPanel ? (
          <div
            className={cn(
              "grid items-start gap-6",
              headerSlot && showProgressPanel
                ? "md:grid-cols-[minmax(240px,_360px)_minmax(0,_1fr)] xl:grid-cols-[minmax(260px,_420px)_minmax(0,_1fr)]"
                : "",
            )}
          >
            {headerSlot ? (
              <div className="min-w-0 w-full md:justify-self-start md:max-w-[320px]">
                {headerSlot}
              </div>
            ) : null}
            {showProgressPanel ? (
              <div className={`min-w-0 ${headerSlot ? "" : "md:col-span-2"}`}>{progressPanel}</div>
            ) : null}
          </div>
        ) : null
      ) : !isStepper && showProgressPanel ? (
        progressPanel
      ) : null}

      <div className="space-y-3 self-start">
        {isStepper ? (
          (() => {
            const activeSection =
              tabSections.find((section) => section.id === activeSectionKey) ?? tabSections[0]
            if (!activeSection) return null
            return (
              <div className="space-y-6">
                {activeSection.fields.map((field) => renderField(field))}
              </div>
            )
          })()
        ) : shouldUseTabs ? (
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            {useInlineTabs ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList className="w-full flex-1 flex-wrap items-end gap-6 border-b border-border/60 bg-transparent p-0 pb-2">
                    {tabSections.map((section, idx) => {
                      const status: TabStepStatus =
                        inlineActiveIndex === -1
                          ? "not_started"
                          : idx < inlineActiveIndex
                            ? "complete"
                            : idx === inlineActiveIndex
                              ? "in_progress"
                              : "not_started"
                      return (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm font-semibold text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
                        >
                          <TabStepBadge status={status} label={idx + 1} />
                          <span>{section.title ?? "Step"}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>
              </div>
            ) : null}
            {tabSections.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="space-y-5 pb-24"
              >
                <div className="space-y-5">
                  {section.fields.map((field) =>
                    renderField(field, useInlineTabs ? { hideLabel: true } : undefined),
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-10 max-h-[calc(100vh-240px)] overflow-y-auto pr-1 scroll-smooth snap-y snap-mandatory">
            {baseSections.map((section, sectionIndex) => (
              <div
                key={section.id ?? `section-${sectionIndex}`}
                className="snap-start scroll-mt-6 pb-[22vh] pt-2"
              >
                <div className="space-y-6">
                  {section.fields.map((field) => renderField(field))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={cn("flex flex-wrap items-start gap-3 pt-2", isStepper && "justify-center")}>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
              !isStepper && "ml-auto",
            )}
          >
            <div className={cn("flex flex-col gap-1", isStepper ? "text-center" : "text-right")}>
              <div className={cn("min-h-[14px] flex flex-wrap justify-end gap-2", !hasMeta && "opacity-0")}>
                {helperText ? <p className="text-emerald-600">{helperText}</p> : null}
                {errorMessage ? <p className="text-rose-500">{errorMessage}</p> : null}
                {statusNote ? <p className="text-amber-600">{statusNote}</p> : null}
                {autoSaving ? <p>Saving…</p> : null}
              </div>
            </div>
            {!isStepper && nextHref ? (
              <Button
                asChild
                size="default"
                variant="outline"
                title="Next module"
                className="relative min-w-[92px] px-2.5"
              >
                <Link
                  href={nextHref}
                  aria-label="Next module"
                  className="inline-flex h-9 items-center justify-center gap-2 px-1"
                >
                  {typeof currentStep === "number" && typeof totalSteps === "number" ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-card px-1 text-[10px] font-semibold text-muted-foreground">
                      {currentStep + 1} of {totalSteps}
                    </span>
                  ) : null}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function deriveAssignmentInitialValues(
  fields: ModuleAssignmentField[],
  submission: { answers?: Record<string, unknown> | null } | null | undefined,
): AssignmentValues {
  return buildAssignmentValues(fields, submission?.answers ?? null)
}
