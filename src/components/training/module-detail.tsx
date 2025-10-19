"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { ArrowRight, ExternalLink, Lock, Play, Send, Video, Pencil, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ResourcesCard } from "./resources-card"
import type { ClassDef, Module, ModuleAssignmentField } from "./types"
import { LessonCreationWizard, type LessonWizardPayload } from "@/components/admin/lesson-creation-wizard"
import { updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"

type AssignmentValues = Record<string, string | string[] | number>

type OptionItem = {
  key: string
  value: string
  label: string
}

function assignmentValuesEqual(a: AssignmentValues, b: AssignmentValues): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    const valueA = a[key]
    const valueB = b[key]
    if (Array.isArray(valueA) || Array.isArray(valueB)) {
      if (!Array.isArray(valueA) || !Array.isArray(valueB)) {
        return false
      }
      if (valueA.length !== valueB.length) return false
      for (let i = 0; i < valueA.length; i += 1) {
        if (valueA[i] !== valueB[i]) return false
      }
    } else if (valueA !== valueB) {
      return false
    }
  }
  return true
}

function normalizeOptions(raw: unknown[]): OptionItem[] {
  return raw.map((option, index) => {
    if (typeof option === "string") {
      const value = option
      return {
        key: `${value}-${index}`,
        value,
        label: option,
      }
    }
    if (option && typeof option === "object") {
      const record = option as Record<string, unknown>
      const rawValue = typeof record.value === "string" ? record.value : null
      const rawLabel = typeof record.label === "string" ? record.label : null
      const value = rawValue ?? rawLabel ?? `option-${index + 1}`
      const label = rawLabel ?? value
      return {
        key: `${value}-${index}`,
        value,
        label,
      }
    }
    const fallback = `option-${index + 1}`
    return {
      key: `${fallback}-${index}`,
      value: fallback,
      label: fallback,
    }
  })
}

function buildAssignmentValues(
  fields: ModuleAssignmentField[],
  answers?: Record<string, unknown> | null,
): AssignmentValues {
  const map: AssignmentValues = {}

  fields.forEach((field) => {
    if (field.type === "subtitle") {
      return
    }

    const rawValue = answers ? answers[field.name] : undefined

    switch (field.type) {
      case "multi_select": {
        const value = Array.isArray(rawValue)
          ? (rawValue as unknown[])
              .map((item) => (typeof item === "string" ? item : String(item ?? ""))).filter(Boolean)
          : []
        map[field.name] = value
        break
      }
      case "slider": {
        const min = field.min ?? 0
        let numeric: number | null = null
        if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
          numeric = rawValue
        } else if (typeof rawValue === "string") {
          const asNumber = Number(rawValue)
          numeric = Number.isFinite(asNumber) ? asNumber : null
        }
        map[field.name] = numeric ?? min
        break
      }
      default: {
        const value = typeof rawValue === "string" ? rawValue : rawValue != null ? String(rawValue) : ""
        map[field.name] = value
      }
    }
  })

  return map
}

function formatTimestamp(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString()
}

function getVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    if (host.includes("youtube.com")) {
      const videoId = url.searchParams.get("v")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host.includes("youtu.be")) {
      const videoId = url.pathname.replace(/^\//, "")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (host.includes("vimeo.com")) {
      const videoId = url.pathname.replace(/^\//, "")
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    if (host.includes("loom.com")) {
      const videoId = url.pathname.split("/").pop()
      return videoId ? `https://www.loom.com/embed/${videoId}` : null
    }
  } catch {
    return null
  }
  return null
}


function AssignmentForm({
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
}: {
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
}) {
  const [values, setValues] = useState<AssignmentValues>(initialValues)

  useEffect(() => {
    setValues((prev) => (assignmentValuesEqual(prev, initialValues) ? prev : initialValues))
  }, [initialValues])

  const updateValue = useCallback((name: string, value: AssignmentValues[string]) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(values)
  }, [onSubmit, values])

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Homework</CardTitle>
          <CardDescription>No assignment data yet — check back soon.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Homework</CardTitle>
          {statusLabel ? <Badge variant={statusVariant}>{statusLabel}</Badge> : null}
        </div>
        <CardDescription>
          Complete the prompts below to mark this module as complete.
          {completeOnSubmit ? " Submitting will automatically mark this module complete." : ""}
        </CardDescription>
        {(() => {
          const lastSaved = formatTimestamp(updatedAt)
          return lastSaved ? (
            <p className="text-xs text-muted-foreground">Last saved {lastSaved}</p>
          ) : null
        })()}
        {statusNote ? <p className="text-xs text-amber-600">{statusNote}</p> : null}
        {helperText ? <p className="text-xs text-emerald-600">{helperText}</p> : null}
        {errorMessage ? <p className="text-xs text-rose-500">{errorMessage}</p> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field) => {
          if (field.type === "subtitle") {
            return (
              <div key={field.name} className="space-y-1">
                <p className="text-sm font-semibold">{field.label}</p>
                {field.description ? <p className="text-sm text-muted-foreground">{field.description}</p> : null}
              </div>
            )
          }

          const labelText = field.required ? `${field.label} *` : field.label
          const description = field.description ? (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          ) : null

          switch (field.type) {
            case "short_text":
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{labelText}</Label>
                  <Input
                    id={field.name}
                    value={(values[field.name] as string) ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  />
                  {description}
                </div>
              )
            case "long_text":
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{labelText}</Label>
                  <Textarea
                    id={field.name}
                    value={(values[field.name] as string) ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                    rows={field.type === "long_text" ? 4 : 3}
                  />
                  {description}
                </div>
              )
            case "select": {
              const normalizedOptions = normalizeOptions(field.options ?? [])
              return (
                <div key={field.name} className="space-y-2">
                  <Label>{labelText}</Label>
                  <Select
                    value={(values[field.name] as string) ?? ""}
                    onValueChange={(next) => updateValue(field.name, next)}
                    disabled={normalizedOptions.length === 0}
                  >
                    <SelectTrigger id={field.name} required={field.required}>
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
                  {normalizedOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No options configured.</p>
                  ) : null}
                  {description}
                </div>
              )
            }
            case "multi_select": {
              const normalizedOptions = normalizeOptions(field.options ?? [])
              return (
                <div key={field.name} className="space-y-2">
                  <Label>{labelText}</Label>
                  <div className="space-y-2">
                    {normalizedOptions.map((option) => {
                      const selected = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : []
                      const checked = selected.includes(option.value)
                      return (
                        <label key={option.key} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = Array.isArray(values[field.name])
                                ? [...(values[field.name] as string[])]
                                : []
                              const isChecked = next === true
                              if (isChecked && !current.includes(option.value)) {
                                current.push(option.value)
                              }
                              if (!isChecked) {
                                const idx = current.indexOf(option.value)
                                if (idx >= 0) current.splice(idx, 1)
                              }
                              updateValue(field.name, current)
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {options.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No options configured.</p>
                  ) : null}
                  {description}
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
                    <Label>{labelText}</Label>
                    <span className="text-xs text-muted-foreground">{sliderValue}</span>
                  </div>
                  <Slider
                    value={[sliderValue]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(next) => updateValue(field.name, next[0] ?? min)}
                  />
                  {description}
                </div>
              )
            }
            case "custom_program":
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{labelText}</Label>
                  {field.programTemplate ? (
                    <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                      {field.programTemplate}
                    </p>
                  ) : null}
                  <Textarea
                    id={field.name}
                    value={(values[field.name] as string) ?? ""}
                    placeholder={field.placeholder ?? "Outline your plan"}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                    rows={4}
                  />
                  {description}
                </div>
              )
            default:
              return null
          }
        })}
      </CardContent>
      <CardFooter className="flex items-center justify-end">
        <Button onClick={handleSubmit} disabled={pending}>
          <Send className="mr-2 h-4 w-4" /> {pending ? "Submitting…" : "Submit"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ModuleDetail({ c, m, isAdmin = false }: { c: ClassDef; m: Module; isAdmin?: boolean }) {
  const router = useRouter()
  const assignmentFields = m.assignment?.fields ?? []
  const completeOnSubmit = Boolean(m.assignment?.completeOnSubmit)
  const lockedForLearners = Boolean(m.locked)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPayload, setWizardPayload] = useState<LessonWizardPayload | null>(null)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [wizardFocusModuleId, setWizardFocusModuleId] = useState<string | null>(m.id)

  const progressStats = useMemo(() => {
    const total = c.modules.length
    const completed = c.modules.reduce((count, module) => {
      const status = module.assignmentSubmission?.status ?? null
      return status === "completed" ? count + 1 : count
    }, 0)
    const currentIndex = c.modules.findIndex((module) => module.id === m.id)
    return {
      total,
      completed,
      currentIndex: currentIndex >= 0 ? currentIndex + 1 : null,
    }
  }, [c.modules, m.id])

  useEffect(() => {
    if (!wizardOpen) {
      setWizardFocusModuleId(m.id)
    }
  }, [m.id, wizardOpen])

  const loadWizardPayload = useCallback(
    async (focusModuleId: string | null) => {
      setWizardError(null)
      setWizardPayload(null)
      setWizardFocusModuleId(focusModuleId ?? m.id)
      setWizardOpen(true)
      setWizardLoading(true)
      let success = false
      try {
        const response = await fetch(`/api/admin/classes/${c.id}/wizard`, { cache: "no-store" })
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error ?? "Failed to load class data")
        }
        const data = (await response.json()) as { payload: LessonWizardPayload }
        setWizardPayload(data.payload)
        success = true
      } catch (err) {
        setWizardError(err instanceof Error ? err.message : "Failed to load class data")
      } finally {
        setWizardLoading(false)
      }
      return success
    },
    [c.id, m.id],
  )

  const handleCreateModule = useCallback(async () => {
    const toastId = toast.loading("Creating module…")
    setWizardError(null)
    setWizardLoading(true)
    try {
      const response = await fetch(`/api/admin/classes/${c.id}/modules`, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create module")
      }
      const data = (await response.json()) as { moduleId?: string }
      if (!data?.moduleId) {
        throw new Error("Module id missing in response")
      }
      const ok = await loadWizardPayload(data.moduleId)
      if (ok) {
        toast.success("Module created", { id: toastId })
        router.refresh()
      } else {
        toast.error("Module created, but failed to open editor", { id: toastId })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create module"
      setWizardError(message)
      toast.error(message, { id: toastId })
      setWizardLoading(false)
    }
  }, [c.id, loadWizardPayload, router])

  const initialFormValues = useMemo(() => {
    return buildAssignmentValues(assignmentFields, m.assignmentSubmission?.answers ?? null)
  }, [assignmentFields, m.assignmentSubmission])

  const [formSeed, setFormSeed] = useState<AssignmentValues>(initialFormValues)
  useEffect(() => {
    setFormSeed((prev) => (assignmentValuesEqual(prev, initialFormValues) ? prev : initialFormValues))
  }, [initialFormValues])

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(m.assignmentSubmission?.status ?? null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(m.assignmentSubmission?.updatedAt ?? null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoCompleteTriggered, setAutoCompleteTriggered] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    setSubmissionStatus(m.assignmentSubmission?.status ?? null)
    setLastSavedAt(m.assignmentSubmission?.updatedAt ?? null)
    setMessage(null)
    setError(null)
    setAutoCompleteTriggered(false)
  }, [m.assignmentSubmission?.status, m.assignmentSubmission?.updatedAt, m.id])

  const handleSubmit = useCallback(
    (values: AssignmentValues) => {
      if (assignmentFields.length === 0) return
      const fieldsSnapshot = assignmentFields
      setMessage(null)
      setError(null)

      startTransition(() => {
        ;(async () => {
          try {
            const response = await fetch(`/api/modules/${m.id}/assignment-submission`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: values }),
            })

            if (!response.ok) {
              let friendly = "Failed to submit assignment."
              try {
                const payload = await response.json()
                if (Array.isArray(payload?.missing) && payload.missing.length > 0) {
                  friendly = `Please complete: ${payload.missing.join(", ")}`
                } else if (typeof payload?.error === "string") {
                  friendly = payload.error
                }
              } catch {
                // ignore parse errors
              }
              setError(friendly)
              return
            }

            const data = (await response.json()) as {
              answers?: Record<string, unknown>
              status?: string | null
              updatedAt?: string | null
              completeOnSubmit?: boolean
            }

            const normalizedAnswers = buildAssignmentValues(fieldsSnapshot, data.answers ?? null)
            setFormSeed(normalizedAnswers)

            const nextStatus = (data.status ?? "submitted") as string
            setSubmissionStatus(nextStatus)

            const savedAt = data.updatedAt ?? new Date().toISOString()
            setLastSavedAt(savedAt)

            const autoComplete = Boolean(data.completeOnSubmit)
            setMessage(autoComplete ? "Submission saved — this module is now marked complete." : "Submission saved.")
            setAutoCompleteTriggered(autoComplete)
            setError(null)

            router.refresh()
          } catch (err) {
            console.error("Assignment submission failed", err)
            setError("Unable to submit assignment. Please try again.")
          }
        })()
      })
    },
    [assignmentFields, m.id, router],
  )

  const statusMeta = useMemo(() => {
    switch (submissionStatus) {
      case "accepted":
        return { label: "Accepted", variant: "default" as const, note: "Submission accepted." }
      case "revise":
        return {
          label: "Needs revision",
          variant: "destructive" as const,
          note: "Updates requested — please revise and resubmit.",
        }
      case "submitted":
        return { label: "Submitted", variant: "secondary" as const, note: null }
      default:
        return null
    }
  }, [submissionStatus])

  const embedUrl = getVideoEmbedUrl(m.videoUrl)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          {(() => {
            const parts: string[] = []
            if (progressStats.currentIndex != null && progressStats.total > 0) {
              parts.push(`Module ${progressStats.currentIndex} of ${progressStats.total}`)
            }
            if (progressStats.total > 0) {
              parts.push(`${progressStats.completed}/${progressStats.total} completed`)
            }
            return parts.length > 0 ? (
              <p className="text-sm text-muted-foreground">{parts.join(" · ")}</p>
            ) : null
          })()}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{m.title}</h1>
          {m.subtitle ? <p className="max-w-3xl text-base text-muted-foreground">{m.subtitle}</p> : null}
        </div>
        {isAdmin ? (
          <div className="flex flex-col items-end gap-2">
            {wizardError ? (
              <p className="text-xs text-rose-500">{wizardError}</p>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="min-h-9 gap-2 shrink-0"
              onClick={() => {
                void loadWizardPayload(m.id)
              }}
              disabled={wizardLoading}
            >
              {wizardLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4" aria-hidden />
              )}
              <span>{wizardLoading ? "Loading…" : "Edit module"}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {isAdmin && lockedForLearners ? (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
          <Lock className="h-4 w-4" />
          <AlertTitle>Locked for learners</AlertTitle>
          <AlertDescription>
            Learners will unlock this module after they complete the prior lessons. You can still preview all content.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" /> Lesson Video
          </CardTitle>
          <CardDescription>Watch before attempting the assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          {embedUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-lg border">
              <iframe
                src={embedUrl}
                title="Lesson video"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : m.videoUrl ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              <p>This video is hosted externally — open it in a new tab to watch.</p>
              <Button asChild size="sm">
                <a href={m.videoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open video
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid aspect-video place-items-center rounded-lg border bg-muted">
              <Button variant="secondary" size="sm" className="pointer-events-none">
                <Play className="mr-2 h-4 w-4" /> Video coming soon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {m.contentMd ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lesson Notes</CardTitle>
            <CardDescription>Additional context and instructions.</CardDescription>
          </CardHeader>
          <CardContent>
            <article className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.contentMd}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray(m.resources) && m.resources.length > 0 ? (
        <ResourcesCard resources={m.resources} />
      ) : null}

      {assignmentFields.length > 0 ? (
        <AssignmentForm
          fields={assignmentFields}
          initialValues={formSeed}
          pending={isSubmitting}
          onSubmit={handleSubmit}
          statusLabel={statusMeta?.label ?? null}
          statusVariant={statusMeta?.variant ?? "outline"}
          statusNote={statusMeta?.note ?? null}
          helperText={message}
          errorMessage={error}
          updatedAt={lastSavedAt}
          completeOnSubmit={completeOnSubmit}
        />
      ) : null}

      {(() => {
        const idx = c.modules.findIndex((x) => x.id === m.id)
        const next = idx >= 0 ? c.modules[idx + 1] : null
        if (next && c.slug) {
          const nextHref = `/class/${c.slug}/module/${idx + 2}`
          const highlight = autoCompleteTriggered
          const nextClassName = cn(
            "flex items-center justify-between rounded-xl border bg-card/60 p-4 transition hover:bg-accent/30",
            highlight ? "ring-2 ring-primary/60" : null,
          )
          return (
            <Link
              href={nextHref}
              className={nextClassName}
            >
              <div>
                <p className="text-sm font-medium">Next</p>
                <p className="text-sm text-muted-foreground">{`Module ${idx + 2} — ${next.title}`}</p>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )
        }
        return null
      })()}

      {isAdmin ? (
        <LessonCreationWizard
          open={wizardOpen}
          mode="edit"
          classId={c.id}
          initialPayload={wizardPayload}
          focusModuleId={wizardFocusModuleId ?? m.id}
          loading={wizardLoading}
          onCreateModule={handleCreateModule}
          onOpenChange={(value) => {
            setWizardOpen(value)
            if (!value) {
              setWizardPayload(null)
              setWizardError(null)
              setWizardFocusModuleId(m.id)
            }
          }}
          onSubmit={updateClassWizardAction}
        />
      ) : null}
    </div>
  )
}
