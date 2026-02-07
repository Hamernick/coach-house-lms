import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"
import Download from "lucide-react/dist/esm/icons/download"
import Info from "lucide-react/dist/esm/icons/info"
import Plus from "lucide-react/dist/esm/icons/plus"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetTable } from "./budget-table"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { RoadmapSectionPanel } from "@/components/roadmap/roadmap-section-panel"
import { cn } from "@/lib/utils"
import { getRoadmapSectionDefinition, type RoadmapSectionDefinition, type RoadmapSectionStatus } from "@/lib/roadmap"
import { toast } from "@/lib/toast"
import { saveRoadmapSectionAction } from "@/actions/roadmap"

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
      <div className="min-h-[240px] rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
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
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
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

type RoadmapCheckpointFieldProps = {
  field: ModuleAssignmentField
  definition: RoadmapSectionDefinition
  value: string
  pending: boolean
  autoSaving: boolean
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  onChange: (next: string) => void
}

function RoadmapCheckpointField({
  field,
  definition,
  value,
  pending,
  autoSaving,
  roadmapStatusBySectionId,
  onChange,
}: RoadmapCheckpointFieldProps) {
  const SectionIcon = ROADMAP_SECTION_ICONS[definition.id] ?? ROADMAP_SECTION_ICONS.origin_story
  const inferredStatus: RoadmapSectionStatus = value.trim().length > 0 ? "in_progress" : "not_started"
  const [status, setStatus] = useState<RoadmapSectionStatus>(
    roadmapStatusBySectionId?.[definition.id] ?? inferredStatus,
  )
  const [statusPending, startStatusTransition] = useTransition()
  const toolbarId = useId()

  useEffect(() => {
    setStatus(roadmapStatusBySectionId?.[definition.id] ?? inferredStatus)
  }, [definition.id, inferredStatus, roadmapStatusBySectionId])

  const handleStatusChange = (nextValue: string) => {
    const nextStatus = nextValue as RoadmapSectionStatus
    if (nextStatus === status) return
    setStatus(nextStatus)
    startStatusTransition(async () => {
      const result = await saveRoadmapSectionAction({
        sectionId: definition.id,
        status: nextStatus,
      })
      if ("error" in result) {
        toast.error(result.error)
        setStatus(roadmapStatusBySectionId?.[definition.id] ?? inferredStatus)
      }
    })
  }

  const saveLabel = statusPending || pending || autoSaving ? "Saving…" : "Saved"

  return (
    <RoadmapSectionPanel
      title={definition.title}
      subtitle={definition.subtitle}
      icon={SectionIcon}
      status={status}
      canEdit
      onStatusChange={handleStatusChange}
      statusSelectDisabled={statusPending}
      toolbarSlotId={toolbarId}
      editorProps={{
        value,
        onChange,
        placeholder: definition.placeholder ?? field.placeholder,
        header: definition.prompt ?? field.label,
        headerClassName: "bg-[#f4f4f5] px-4 pt-4 pb-3 text-sm text-muted-foreground dark:bg-[#1f1f1f]",
        countClassName: "bg-[#e6e6e6] px-4 py-2 text-xs text-muted-foreground dark:bg-[#1c1c1c]",
        contentClassName:
          "flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#ededed] dark:bg-[#171717] rounded-none",
        toolbarClassName:
          "rounded-xl border border-border/60 bg-background/80 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]",
        className: "flex h-full min-h-0 flex-1 flex-col bg-card dark:bg-[#1f1f1f]",
        editorClassName: "flex-1 min-h-0 h-full overflow-visible rounded-none bg-transparent dark:bg-[#171717]",
        minHeight: 560,
        disableResize: true,
        toolbarPortalId: toolbarId,
        toolbarTrailingActions: (
          <Button type="button" size="sm" variant="ghost" className="gap-2 text-muted-foreground" disabled>
            {saveLabel}
          </Button>
        ),
      }}
    />
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
  roadmapStatusBySectionId,
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
  const pathname = usePathname()
  const isAcceleratorShell = (pathname ?? "").startsWith("/accelerator")
  const [values, setValues] = useState<AssignmentValues>(initialValues)
  const initialValuesRef = useRef(initialValues)
  const moduleIdRef = useRef(moduleId)
  const valuesRef = useRef(values)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const [autoSaving, setAutoSaving] = useState(false)
  const richTextMinHeight = isAcceleratorShell ? 560 : 420
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const showStatusBadge = statusLabel && statusLabel !== "Submitted"
  const hasMeta = Boolean(showStatusBadge || helperText || errorMessage || statusNote || autoSaving)
  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    const moduleChanged = moduleIdRef.current !== moduleId
    if (moduleChanged) {
      moduleIdRef.current = moduleId
      initialValuesRef.current = initialValues
      setValues(initialValues)
      return
    }

    if (assignmentValuesEqual(initialValuesRef.current, initialValues)) {
      return
    }

    const canReplace = assignmentValuesEqual(valuesRef.current, initialValuesRef.current)
    initialValuesRef.current = initialValues
    if (canReplace) {
      setValues(initialValues)
    }
  }, [initialValues, moduleId])

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

  const updateValue = useCallback((name: string, value: AssignmentValues[string]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(values)
  }, [onSubmit, values])

  const renderField = useCallback(
    (field: ModuleAssignmentField, options?: { hideLabel?: boolean }) => {
      const hideLabel = Boolean(options?.hideLabel)
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
          {
            const value = (values[field.name] as string) ?? ""
            if (field.roadmapSectionId) {
              const roadmapDefinition = getRoadmapSectionDefinition(field.roadmapSectionId)
              if (roadmapDefinition) {
                return (
                  <RoadmapCheckpointField
                    key={field.name}
                    field={field}
                    definition={roadmapDefinition}
                    value={value}
                    pending={pending}
                    autoSaving={autoSaving}
                    roadmapStatusBySectionId={roadmapStatusBySectionId}
                    onChange={(next) => updateValue(field.name, next)}
                  />
                )
              }
            }
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
                <div className={cn(isAcceleratorShell ? "min-h-[560px]" : "min-h-[420px]")}>
                  <RichTextEditorLazy
                    value={value}
                    onChange={(next) => updateValue(field.name, next)}
                    placeholder={field.placeholder}
                    mode="homework"
                    minHeight={richTextMinHeight}
                  />
                </div>
              </div>
            )
          }
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
          const unitOptions = [
            "Session / Hour",
            "Participant / Session",
            "Participant / Event",
            "Event / Month",
            "Participant / Trip",
            "Program / Participant",
            "Program / Session",
          ]
          const unitListId = `${field.name}-unit-options`
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
          const budgetTableFrameClass =
            "relative left-1/2 ml-[calc(-50vw+10px)] w-[calc(100vw-20px)] sm:ml-[calc(-50vw+var(--sidebar-width,0px)/2+10px)] sm:w-[calc(100vw-var(--sidebar-width,0px)-20px)]"
          const budgetTemplateHref = "/templates/budget-template.csv"
          const budgetGuideSteps = [
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
                {budgetGuideSteps.map((step, index) => (
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
            updateValue(field.name, [...ensureRows, { ...blankRow, ...seed }])
          }

          const updateRow = (rowIndex: number, patch: Partial<BudgetTableRow>) => {
            const nextRows = [...ensureRows]
            const nextRow = { ...nextRows[rowIndex], ...patch }
            nextRow.totalCost = formatMoney(computeTotal(nextRow))
            nextRows[rowIndex] = nextRow
            updateValue(field.name, nextRows)
          }

          return (
            <div key={field.name} className="space-y-4">
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
                      <a href={budgetTemplateHref} download>
                        <Download className="h-4 w-4" aria-hidden />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <BudgetTable
                rows={ensureRows}
                blankRow={blankRow}
                totals={totals}
                subtotal={subtotal}
                costTypeOptions={costTypeOptions}
                unitOptions={unitOptions}
                unitListId={unitListId}
                formatMoney={formatMoney}
                onUpdateRow={updateRow}
                onRowsChange={(nextRows) => updateValue(field.name, nextRows)}
                frameClassName={budgetTableFrameClass}
              />
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
              <div className={cn(isAcceleratorShell ? "min-h-[560px]" : "min-h-[420px]")}>
                <RichTextEditorLazy
                  value={(values[field.name] as string) ?? ""}
                  onChange={(next) => updateValue(field.name, next)}
                  placeholder={field.placeholder ?? "Outline your plan"}
                  mode="homework"
                  minHeight={richTextMinHeight}
                />
              </div>
            </div>
          )
        default:
          return null
      }
    },
    [autoSaving, isAcceleratorShell, pending, richTextMinHeight, roadmapStatusBySectionId, updateValue, values],
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
    ? "flex h-full min-h-0 flex-1 flex-col gap-6"
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

      <div className={cn("space-y-3 self-start", isStepper && "flex min-h-0 flex-1 flex-col self-stretch")}>
        {isStepper ? (
          (() => {
            const activeSection =
              tabSections.find((section) => section.id === activeSectionKey) ?? tabSections[0]
            if (!activeSection) return null
            const stretchSingleField =
              activeSection.fields.length === 1 && activeSection.fields[0]?.type === "long_text"
            return (
              <div className={cn("space-y-6", stretchSingleField && "flex h-full min-h-0 flex-1 flex-col")}>
                {activeSection.fields.map((field) => (
                  <div key={field.name} className={cn(stretchSingleField && "min-h-0 flex-1")}>
                    {renderField(field)}
                  </div>
                ))}
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
