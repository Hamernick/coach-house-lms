import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
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
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import type { ModuleAssignmentField } from "../types"
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
  onSubmit: (values: AssignmentValues) => void
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
  statusLabel,
  statusVariant = "outline",
  helperText,
  errorMessage,
  updatedAt,
  completeOnSubmit,
  statusNote,
  moduleId,
  moduleTitle,
  classTitle,
  nextHref = null,
  currentStep,
  totalSteps,
}: AssignmentFormProps) {
  const [values, setValues] = useState<AssignmentValues>(initialValues)
  const [activeAssistField, setActiveAssistField] = useState<string | null>(null)
  const [isAssistPending, startAssistTransition] = useTransition()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const showStatusBadge = statusLabel && statusLabel !== "Submitted"
  const hasMeta = Boolean(showStatusBadge || helperText || errorMessage || statusNote)
  const [lastSavedShort, setLastSavedShort] = useState<string | null>(null)

  useEffect(() => {
    if (!updatedAt) {
      setLastSavedShort(null)
      return
    }
    const saved = new Date(updatedAt)
    if (Number.isNaN(saved.getTime())) {
      setLastSavedShort(null)
      return
    }
    const now = new Date()
    const isToday =
      saved.getFullYear() === now.getFullYear() &&
      saved.getMonth() === now.getMonth() &&
      saved.getDate() === now.getDate()
    const dayLabel = isToday ? "Today" : `${saved.getMonth() + 1}/${saved.getDate()}`
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(saved)
    setLastSavedShort(`Last saved ${dayLabel}, ${timeLabel}`)
  }, [updatedAt])

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

  const updateValue = useCallback((name: string, value: AssignmentValues[string]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(values)
  }, [onSubmit, values])

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
      const description = field.description ? <p className="text-xs text-muted-foreground">{field.description}</p> : null
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
            <div key={field.name} className="space-y-2">
              {!hideLabel || (!hideAssist && moduleId) ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor={fieldId} className={labelClassName}>
                    {labelText}
                  </Label>
                  {!hideAssist && moduleId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssist(field)}
                      disabled={isAssistPending && activeAssistField === field.name}
                      className="gap-1"
                    >
                      {isAssistPending && activeAssistField === field.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Assist
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Label htmlFor={fieldId} className={labelClassName}>
                  {labelText}
                </Label>
              )}
              {description}
              <RichTextEditorLazy
                value={(values[field.name] as string) ?? ""}
                onChange={(next) => updateValue(field.name, next)}
                placeholder={field.placeholder}
                mode="homework"
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
              {!hideLabel || (!hideAssist && moduleId) ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor={fieldId} className={labelClassName}>
                    {labelText}
                  </Label>
                  {!hideAssist && moduleId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssist(field)}
                      disabled={isAssistPending && activeAssistField === field.name}
                      className="gap-1"
                    >
                      {isAssistPending && activeAssistField === field.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Assist
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Label htmlFor={fieldId} className={labelClassName}>
                  {labelText}
                </Label>
              )}
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
              />
            </div>
          )
        default:
          return null
      }
    },
    [activeAssistField, handleAssist, isAssistPending, moduleId, updateValue, values],
  )

  type Section = { id: string; title?: string; description?: string; fields: ModuleAssignmentField[] }

  const baseSections = useMemo(() => {
    const result: Section[] = []
    let current: Section | null = null

    fields.forEach((field) => {
      if (field.name === "origin_personal_why") {
        const dedicated: Section = {
          id: "section-personal-why",
          title: field.label ?? "Your personal why",
          description: field.description,
          fields: [field],
        }
        result.push(dedicated)
        current = dedicated
        return
      }

      if (field.type === "subtitle") {
        current = {
          id: `section-${result.length + 1}`,
          title: field.label,
          description: field.description,
          fields: [],
        }
        result.push(current)
      } else {
        if (!current) {
          current = {
            id: "section-0",
            fields: [],
          }
          result.push(current)
        }
        current.fields.push(field)
      }
    })

    if (result.length === 0) {
      return [
        {
          id: "section-0",
          fields,
        },
      ] as Section[]
    }

    return result
  }, [fields])

  const tabSections = useMemo(() => {
    if (baseSections.length === 1 && baseSections[0]?.fields.length > 1 && !baseSections[0].title) {
      // Turn a flat list of prompts into individual tabs.
      return baseSections[0].fields.map((field, idx) => ({
        id: `prompt-${idx}`,
        title: field.label || `Prompt ${idx + 1}`,
        description: field.description,
        fields: [field],
      })) as Section[]
    }

    if (baseSections.length <= 1) {
      const flatFields = baseSections.flatMap((section) => section.fields)
      if (flatFields.length > 1) {
        return flatFields.map((field, idx) => ({
          id: `prompt-${idx}`,
          title: field.label || `Prompt ${idx + 1}`,
          description: field.description,
          fields: [field],
        }))
      }
    }

    return baseSections
  }, [baseSections])

  const shouldUseTabs = tabSections.length > 1
  const inlineTabTitles = useMemo(() => {
    return tabSections.map((section) => (section.title ?? "").trim().toLowerCase())
  }, [tabSections])
  const useInlineTabs = shouldUseTabs && inlineTabTitles.join("|") === "if|then|so"
  const [activeSection, setActiveSection] = useState<string>(tabSections[0]?.id ?? "section-0")

  useEffect(() => {
    setActiveSection((prev) => (tabSections.some((s) => s.id === prev) ? prev : tabSections[0]?.id ?? "section-0"))
  }, [tabSections])

  useLayoutEffect(() => {
    const idx = tabSections.findIndex((tab) => tab.id === activeSection)
    const el = tabRefs.current[idx]
    if (el) {
      const { offsetTop, offsetHeight } = el
      setIndicator({ top: offsetTop, height: offsetHeight })
    }
  }, [activeSection, tabSections])

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
    const active = tabSections.find((section) => section.id === activeSection) ?? tabSections[0]
    return active?.fields[0] ?? null
  }, [activeSection, tabSections, useInlineTabs])

  const inlineActiveIndex = useMemo(() => {
    if (!useInlineTabs) return -1
    return tabSections.findIndex((section) => section.id === activeSection)
  }, [activeSection, tabSections, useInlineTabs])

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

  // Persist drafts locally and auto-save to server
  useEffect(() => {
    if (typeof window === "undefined") return
    const key = `assignment-autosave-${moduleId}`
    try {
      window.localStorage.setItem(key, JSON.stringify({ values }))
    } catch {
      // ignore storage errors
    }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaving(true)
      Promise.resolve(onSubmit(values))
        .catch((err) => {
          console.error("Autosave failed", err)
        })
        .finally(() => setAutoSaving(false))
    }, 2000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [moduleId, onSubmit, values])

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(260px,_320px)_minmax(0,_1fr)]">
      <div className="rounded-2xl border border-border/60 bg-card/70 px-4 pb-4 pt-3 self-start overflow-hidden">
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
        {useInlineTabs ? (
          <div className="pt-3 text-xs text-muted-foreground">
            {overall.answered}/{overall.total} prompts completed
          </div>
        ) : (
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
                      <span className={`shrink-0 min-w-[32px] text-right text-[11px] font-semibold leading-none ${badgeClass}`}>
                        {answered}/{total || 0}
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
        )}
      </div>

      <div className="space-y-3 self-start">
        {shouldUseTabs ? (
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
                  {moduleId && activeInlineField ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssist(activeInlineField)}
                      disabled={isAssistPending && activeAssistField === activeInlineField.name}
                      className="gap-1"
                    >
                      {isAssistPending && activeAssistField === activeInlineField.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Assist
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {tabSections.map((section) => (
              <TabsContent
                key={section.id}
                value={section.id}
                className="space-y-5"
              >
                <div className="space-y-5">
                  {section.fields.map((field) =>
                    renderField(field, useInlineTabs ? { hideLabel: true, hideAssist: true } : undefined),
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          baseSections.map((section, sectionIndex) => (
            <div key={section.id ?? `section-${sectionIndex}`} className="space-y-4">
              <div className="space-y-6">
                {section.fields.map((field) => renderField(field))}
              </div>
            </div>
          ))
        )}

        <div className="flex flex-wrap items-start justify-between gap-3 pt-2">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {lastSavedShort ? <p>{lastSavedShort}</p> : null}
            {hasMeta ? (
              <div className="flex flex-wrap items-center gap-2">
                {helperText ? <p className="text-emerald-600">{helperText}</p> : null}
                {errorMessage ? <p className="text-rose-500">{errorMessage}</p> : null}
                {statusNote ? <p className="text-amber-600">{statusNote}</p> : null}
                {autoSaving ? <p>Autosaving…</p> : null}
              </div>
            ) : null}
          </div>
          {nextHref ? (
            <Button asChild size="default" variant="outline" title="Next module" className="relative min-w-[64px] px-2.5">
              <Link href={nextHref} aria-label="Next module" className="inline-flex h-9 items-center justify-center gap-2 px-1">
                {typeof currentStep === "number" && typeof totalSteps === "number" ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-card px-1 text-[10px] font-semibold text-muted-foreground">
                    {currentStep + 1}/{totalSteps}
                  </span>
                ) : null}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
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
