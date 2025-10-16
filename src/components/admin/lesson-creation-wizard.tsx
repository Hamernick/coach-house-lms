"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Textarea } from "@/components/ui/textarea"
import {
  type LucideIcon,
  Plus,
  X,
  Link as LinkIcon,
  Video,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Youtube,
  Box,
  HardDrive,
  Clapperboard,
  Figma,
} from "lucide-react"
import {
  LESSON_SUBTITLE_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  MODULE_SUBTITLE_MAX_LENGTH,
  MODULE_TITLE_MAX_LENGTH,
  clampText,
} from "@/lib/lessons/limits"

interface LessonLink {
  id: string
  title: string
  url: string
  providerSlug: ProviderSlug
}

interface Resource {
  id: string
  title: string
  url: string
  providerSlug: ProviderSlug
}

type FormFieldType =
  | "short_text"
  | "long_text"
  | "select"
  | "multi_select"
  | "slider"
  | "subtitle"
  | "custom_program"

interface FormField {
  id: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
  min?: number | null
  max?: number | null
  step?: number | null
  programTemplate?: string
}

interface ModuleDefinition {
  id: string
  moduleId?: string
  title: string
  subtitle: string
  body: string
  videoUrl: string
  resources: Resource[]
  formFields: FormField[]
}

export interface LessonWizardPayload {
  title: string
  subtitle: string
  body: string
  videoUrl: string
  links: Array<{ title: string; url: string; provider?: ProviderSlug }>
  modules: Array<{
    moduleId?: string
    title: string
    subtitle: string
    body: string
    videoUrl: string
    resources: Array<{ title: string; url?: string | null; provider?: ProviderSlug | null }>
    formFields: Array<{
      label: string
      type: FormFieldType
      required: boolean
      placeholder?: string | null
      description?: string | null
      options?: string[] | null
      min?: number | null
      max?: number | null
      step?: number | null
      programTemplate?: string | null
    }>
  }>
}

interface LessonCreationWizardProps {
  open: boolean
  mode?: "create" | "edit"
  classId?: string
  initialPayload?: LessonWizardPayload | null
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData) => Promise<{ id?: string; error?: string }>
}

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

type ProviderSlug =
  | "youtube"
  | "google-drive"
  | "dropbox"
  | "loom"
  | "vimeo"
  | "notion"
  | "figma"
  | "generic"

interface ProviderMeta {
  slug: ProviderSlug
  icon: LucideIcon
}

const PROVIDER_META: Record<ProviderSlug, { icon: LucideIcon }> = {
  youtube: { icon: Youtube },
  "google-drive": { icon: HardDrive },
  dropbox: { icon: Box },
  loom: { icon: Video },
  vimeo: { icon: Clapperboard },
  notion: { icon: FileText },
  figma: { icon: Figma },
  generic: { icon: Globe },
}

const PROVIDER_PATTERNS: Array<{ slug: ProviderSlug; hosts: RegExp[] }> = [
  { slug: "youtube", hosts: [/youtube\.com$/, /youtu\.be$/] },
  { slug: "google-drive", hosts: [/drive\.google\.com$/, /docs\.google\.com$/] },
  { slug: "dropbox", hosts: [/dropbox\.com$/, /dropboxusercontent\.com$/] },
  { slug: "loom", hosts: [/loom\.com$/] },
  { slug: "vimeo", hosts: [/vimeo\.com$/] },
  { slug: "notion", hosts: [/notion\.so$/] },
  { slug: "figma", hosts: [/figma\.com$/] },
]

function inferProviderSlug(rawUrl: string | null | undefined): ProviderSlug {
  if (!rawUrl) return "generic"
  let host: string
  try {
    const parsed = new URL(rawUrl)
    host = parsed.hostname.toLowerCase()
  } catch {
    return "generic"
  }
  for (const pattern of PROVIDER_PATTERNS) {
    if (pattern.hosts.some((regex) => regex.test(host))) {
      return pattern.slug
    }
  }
  return "generic"
}

function getProviderMeta(slug?: ProviderSlug | null): ProviderMeta {
  const key = slug ?? "generic"
  const meta = PROVIDER_META[key] ?? PROVIDER_META.generic
  return { slug: key, icon: meta.icon }
}

const FORM_FIELD_TYPE_OPTIONS: Array<{ value: FormFieldType; label: string }> = [
  { value: "short_text", label: "Short text input" },
  { value: "long_text", label: "Long text area" },
  { value: "select", label: "Select dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "slider", label: "Slider" },
  { value: "subtitle", label: "Subtitle / section heading" },
  { value: "custom_program", label: "Custom program builder" },
]

const DEFAULT_SLIDER_RANGE = { min: 0, max: 100, step: 1 }

function normalizeFormFieldType(raw: unknown): FormFieldType {
  const value = typeof raw === "string" ? raw : "short_text"
  switch (value) {
    case "short_text":
    case "long_text":
    case "select":
    case "multi_select":
    case "slider":
    case "subtitle":
    case "custom_program":
      return value
    case "text":
      return "short_text"
    case "textarea":
      return "long_text"
    case "display":
      return "subtitle"
    default:
      return "short_text"
  }
}

function createDefaultFormField(): FormField {
  return {
    id: makeId(),
    label: "",
    type: "short_text",
    required: false,
    placeholder: "",
    description: "",
    options: [],
    min: null,
    max: null,
    step: null,
    programTemplate: "",
  }
}

function parseOptions(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter((option, index, array) => option.length > 0 && array.indexOf(option) === index)
}

function optionsToTextareaValue(options?: string[]): string {
  if (!Array.isArray(options) || options.length === 0) return ""
  return options.join("\n")
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeFieldForType(field: FormField, nextType: FormFieldType): FormField {
  const base: FormField = {
    ...field,
    type: nextType,
  }

  switch (nextType) {
    case "short_text":
      return {
        ...base,
        required: field.required,
        placeholder: field.placeholder ?? "",
        description: field.description ?? "",
        options: undefined,
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
    case "long_text":
      return {
        ...base,
        required: field.required,
        placeholder: field.placeholder ?? "",
        description: field.description ?? "",
        options: undefined,
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
    case "select":
      return {
        ...base,
        required: field.required,
        placeholder: field.placeholder ?? "",
        description: field.description ?? "",
        options: Array.isArray(field.options) ? field.options : [],
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
    case "multi_select":
      return {
        ...base,
        required: field.required,
        placeholder: field.placeholder ?? "",
        description: field.description ?? "",
        options: Array.isArray(field.options) ? field.options : [],
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
    case "slider": {
      const min = toNumberOrNull(field.min) ?? DEFAULT_SLIDER_RANGE.min
      const max = toNumberOrNull(field.max) ?? DEFAULT_SLIDER_RANGE.max
      const step = toNumberOrNull(field.step) ?? DEFAULT_SLIDER_RANGE.step
      const adjustedMin = min
      const adjustedMax = max < adjustedMin ? adjustedMin : max
      const adjustedStep = step <= 0 ? DEFAULT_SLIDER_RANGE.step : step
      return {
        ...base,
        required: field.required,
        placeholder: "",
        description: field.description ?? "",
        options: undefined,
        min: adjustedMin,
        max: adjustedMax,
        step: adjustedStep,
        programTemplate: undefined,
      }
    }
    case "subtitle":
      return {
        ...base,
        required: false,
        description: field.description ?? "",
        placeholder: "",
        options: undefined,
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
    case "custom_program":
      return {
        ...base,
        required: field.required,
        placeholder: "",
        description: field.description ?? "",
        options: undefined,
        min: null,
        max: null,
        step: null,
        programTemplate: field.programTemplate ?? "",
      }
    default:
      return {
        ...base,
        required: field.required,
        placeholder: field.placeholder ?? "",
        description: field.description ?? "",
        options: undefined,
        min: null,
        max: null,
        step: null,
        programTemplate: undefined,
      }
  }
}

export function LessonCreationWizard({
  open,
  mode = "create",
  classId,
  initialPayload = null,
  onOpenChange,
  onSubmit,
}: LessonCreationWizardProps) {
  const [step, setStep] = useState(1)

  // Landing page data
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [body, setBody] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [links, setLinks] = useState<LessonLink[]>([])

  // Modules data
  const [modules, setModules] = useState<ModuleDefinition[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)

  const totalSteps = useMemo(() => 2 + modules.length, [modules.length])

  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditMode = mode === "edit"

  const resetWizard = useCallback(() => {
    setStep(1)
    setTitle("")
    setSubtitle("")
    setBody("")
    setVideoUrl("")
    setLinks([])
    setModules([])
    setCurrentModuleIndex(0)
    setError(null)
  }, [])

  const applyPayloadToState = useCallback((payload: LessonWizardPayload) => {
    setStep(1)
    setTitle(clampText(payload.title ?? "", LESSON_TITLE_MAX_LENGTH))
    setSubtitle(clampText(payload.subtitle ?? "", LESSON_SUBTITLE_MAX_LENGTH))
    setBody(payload.body ?? "")
    setVideoUrl(payload.videoUrl ?? "")
    setLinks(() =>
      (payload.links ?? []).map((link) => ({
        id: makeId(),
        title: link.title ?? "",
        url: link.url ?? "",
        providerSlug: inferProviderSlug(link.url),
      }))
    )
    setModules(
      () =>
        (payload.modules ?? []).map((module) => ({
          id: makeId(),
          moduleId: module.moduleId,
          title: clampText(module.title ?? "", MODULE_TITLE_MAX_LENGTH),
          subtitle: clampText(module.subtitle ?? "", MODULE_SUBTITLE_MAX_LENGTH),
          body: module.body ?? "",
          videoUrl: module.videoUrl ?? "",
          resources: (module.resources ?? []).map((resource) => ({
            id: makeId(),
            title: resource.title ?? "",
            url: resource.url ?? "",
            providerSlug: inferProviderSlug(resource.url ?? undefined),
          })),
          formFields: (module.formFields ?? []).map((field) => {
            const base = createDefaultFormField()
            const type = normalizeFormFieldType(field.type)
            const placeholder = typeof field.placeholder === "string" ? field.placeholder : ""
            const description = typeof field.description === "string" ? field.description : ""
            const options = Array.isArray(field.options)
              ? field.options.map((option) => String(option).trim()).filter(Boolean)
              : []
            const min = toNumberOrNull(field.min)
            const max = toNumberOrNull(field.max)
            const step = toNumberOrNull(field.step)
            const programTemplate = typeof field.programTemplate === "string" ? field.programTemplate : ""

            return normalizeFieldForType(
              {
                ...base,
                id: makeId(),
                label: field.label ?? "",
                type,
                required: type === "subtitle" ? false : Boolean(field.required),
                placeholder,
                description,
                options,
                min,
                max,
                step,
                programTemplate,
              },
              type,
            )
          }),
        }))
    )
    setCurrentModuleIndex(0)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) return
    if (isEditMode) {
      if (initialPayload) {
        applyPayloadToState(initialPayload)
      }
    } else {
      resetWizard()
    }
  }, [open, isEditMode, initialPayload, applyPayloadToState, resetWizard])

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      { id: makeId(), title: "", url: "", providerSlug: "generic" },
    ])
  }

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const updateLink = (id: string, field: "title" | "url", value: string) => {
    setLinks((prev) =>
      prev.map((link) => {
        if (link.id !== id) return link
        const next = { ...link, [field]: value }
        if (field === "url") {
          next.providerSlug = inferProviderSlug(value)
        }
        return next
      }),
    )
  }

  const addModule = () => {
    if (isEditMode) return
    setModules((prev) => [
      ...prev,
      {
        id: makeId(),
        title: "",
        subtitle: "",
        body: "",
        videoUrl: "",
        resources: [],
        formFields: [],
      },
    ])
  }

  const removeModule = (index: number) => {
    if (isEditMode) return
    setModules((prev) => prev.filter((_, i) => i !== index))
    setCurrentModuleIndex((prev) => Math.max(0, Math.min(prev, modules.length - 2)))
  }

  const updateModule = (index: number, field: keyof ModuleDefinition, value: unknown) => {
    setModules((prev) => {
      const next = [...prev]
      const current = next[index]
      if (!current) {
        return prev
      }

      let nextValue = value
      if (typeof value === "string") {
        if (field === "title") {
          nextValue = clampText(value, MODULE_TITLE_MAX_LENGTH)
        } else if (field === "subtitle") {
          nextValue = clampText(value, MODULE_SUBTITLE_MAX_LENGTH)
        }
      }

      next[index] = { ...current, [field]: nextValue } as ModuleDefinition
      return next
    })
  }

  const addResource = (moduleIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      next[moduleIndex] = {
        ...next[moduleIndex],
        resources: [
          ...next[moduleIndex].resources,
          {
            id: makeId(),
            title: "",
            url: "",
            providerSlug: "generic",
          },
        ],
      }
      return next
    })
  }

  const removeResource = (moduleIndex: number, resourceId: string) => {
    setModules((prev) => {
      const next = [...prev]
      next[moduleIndex] = {
        ...next[moduleIndex],
        resources: next[moduleIndex].resources.filter((resource) => resource.id !== resourceId),
      }
      return next
    })
  }

  const updateResource = (moduleIndex: number, resourceId: string, field: 'title' | 'url', value: string) => {
    setModules((prev) => {
      const next = [...prev]
      const target = next[moduleIndex].resources.map((resource) => {
        if (resource.id !== resourceId) return resource
        const nextResource = { ...resource, [field]: value }
        if (field === 'url') {
          nextResource.providerSlug = inferProviderSlug(value)
        }
        return nextResource
      })
      next[moduleIndex] = { ...next[moduleIndex], resources: target }
      return next
    })
  }

  const addFormField = (moduleIndex: number) => {
    setModules((prev) => {
      const next = [...prev]
      next[moduleIndex] = {
        ...next[moduleIndex],
        formFields: [
          ...next[moduleIndex].formFields,
          createDefaultFormField(),
        ],
      }
      return next
    })
  }

  const removeFormField = (moduleIndex: number, fieldId: string) => {
    setModules((prev) => {
      const next = [...prev]
      next[moduleIndex] = {
        ...next[moduleIndex],
        formFields: next[moduleIndex].formFields.filter((field) => field.id !== fieldId),
      }
      return next
    })
  }

  const updateFormField = (moduleIndex: number, fieldId: string, updater: (current: FormField) => FormField) => {
    setModules((prev) => {
      const next = [...prev]
      const formFields = next[moduleIndex].formFields.map((item) =>
        item.id === fieldId ? updater(item) : item,
      )
      next[moduleIndex] = { ...next[moduleIndex], formFields }
      return next
    })
  }

  const handleBack = () => {
    if (step === 1) return
    if (step === 3 && totalSteps === 3) {
      setStep(2)
      return
    }
    setStep((prev) => Math.max(1, prev - 1))
    if (step > 2) {
      setCurrentModuleIndex((prev) => Math.max(0, prev - 1))
    }
  }

  const lessonTitle = clampText(title.trim(), LESSON_TITLE_MAX_LENGTH)

  const handleNext = () => {
    if (step === 1) {
      if (!lessonTitle) {
        setError("Lesson title is required before continuing.")
        return
      }
      setError(null)
      setStep(2)
      return
    }

    if (step === 2) {
      if (modules.length === 0) {
        if (isEditMode) {
          setError("Add at least one module before continuing.")
          return
        }
        addModule()
      }
      setStep(3)
      setCurrentModuleIndex(0)
      return
    }

    if (step >= 3 && step < totalSteps) {
      const currentModule = modules[currentModuleIndex]
      if (!currentModule || currentModule.title.trim().length === 0) {
        setError("Each module needs a title before you continue.")
        return
      }
      setError(null)
      setStep((prev) => prev + 1)
      setCurrentModuleIndex((prev) => Math.min(prev + 1, modules.length - 1))
    }
  }

  const lessonSubtitle = clampText(subtitle.trim(), LESSON_SUBTITLE_MAX_LENGTH)

  const handleFinish = () => {
    if (!lessonTitle) {
      setError("Lesson title is required.")
      return
    }

    if (modules.length === 0) {
      setError("Add at least one module before creating the lesson.")
      return
    }

    const missingModuleIndex = modules.findIndex((module) => module.title.trim().length === 0)
    if (missingModuleIndex !== -1) {
      setError(`Module ${missingModuleIndex + 1} is missing a title.`)
      return
    }

    const payload: LessonWizardPayload = {
      title: lessonTitle,
      subtitle: lessonSubtitle,
      body,
      videoUrl: videoUrl.trim(),
      links: links
        .map((link) => ({
          title: link.title.trim(),
          url: link.url.trim(),
          provider: link.providerSlug,
        }))
        .filter((link) => link.title.length > 0 || link.url.length > 0),
      modules: modules.map((moduleItem) => {
        const moduleTitle = clampText(moduleItem.title.trim(), MODULE_TITLE_MAX_LENGTH)
        const moduleSubtitle = clampText(moduleItem.subtitle.trim(), MODULE_SUBTITLE_MAX_LENGTH)

        return {
          moduleId: moduleItem.moduleId,
          title: moduleTitle,
          subtitle: moduleSubtitle,
          body: moduleItem.body,
          videoUrl: moduleItem.videoUrl.trim(),
          resources: moduleItem.resources.map((resource) => ({
            title: resource.title.trim(),
            type: "link",
            url: resource.url.trim() || null,
            provider: resource.providerSlug,
          })),
        formFields: moduleItem.formFields.map((field) => {
          const options = Array.isArray(field.options)
            ? field.options.map((option) => option.trim()).filter(Boolean)
            : []
          const placeholder = field.placeholder?.trim() ?? ""
          const description = field.description?.trim() ?? ""
          const min = toNumberOrNull(field.min)
          const max = toNumberOrNull(field.max)
          const step = toNumberOrNull(field.step)

          return {
            label: field.label.trim(),
            type: field.type,
            required: field.type === "subtitle" ? false : field.required,
            placeholder: placeholder || undefined,
            description: description || undefined,
            options:
              field.type === "select" || field.type === "multi_select" ? (options.length > 0 ? options : undefined) : undefined,
            min: field.type === "slider" ? min ?? DEFAULT_SLIDER_RANGE.min : undefined,
            max: field.type === "slider" ? max ?? DEFAULT_SLIDER_RANGE.max : undefined,
            step: field.type === "slider" ? step ?? DEFAULT_SLIDER_RANGE.step : undefined,
            programTemplate:
              field.type === "custom_program" && field.programTemplate
                ? field.programTemplate.trim()
                : field.type === "custom_program"
                  ? ""
                  : undefined,
          }
        }),
        }
      }),
    }

    const fd = new FormData()
    fd.set("payload", JSON.stringify(payload))
    if (isEditMode && classId) {
      fd.set("classId", classId)
    }

    startTransition(async () => {
      try {
        const result = await onSubmit(fd)
        if (result?.error) {
          setError(result.error)
          return
        }
        resetWizard()
        onOpenChange(false)
        const nextId = result?.id ?? classId
        if (mode === "create") {
          if (nextId) {
            window.location.href = `/admin/classes/${nextId}`
          }
        } else {
          window.location.reload()
        }
      } catch (err) {
        console.error(err)
        setError("Failed to create lesson. Please try again.")
      }
    })
  }

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              index + 1 < step
                ? "bg-accent text-accent-foreground"
                : index + 1 === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {index + 1 < step ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          {index < totalSteps - 1 ? (
            <div className={`h-0.5 w-12 ${index + 1 < step ? "bg-accent" : "bg-muted"}`} />
          ) : null}
        </div>
      ))}
    </div>
  )

  const renderLandingPageStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Lesson Landing Page</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Create the main landing page for your lesson. This is what students will see first.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Lesson Title *</Label>
            <span className="text-xs text-muted-foreground">
              {title.length}/{LESSON_TITLE_MAX_LENGTH}
            </span>
          </div>
          <Input
            id="title"
            placeholder="Introduction to Web Development"
            value={title}
            maxLength={LESSON_TITLE_MAX_LENGTH}
            onChange={(e) => setTitle(clampText(e.target.value, LESSON_TITLE_MAX_LENGTH))}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subtitle">Subtitle</Label>
            <span className="text-xs text-muted-foreground">
              {subtitle.length}/{LESSON_SUBTITLE_MAX_LENGTH}
            </span>
          </div>
          <Input
            id="subtitle"
            placeholder="Learn the fundamentals of HTML, CSS, and JavaScript"
            value={subtitle}
            maxLength={LESSON_SUBTITLE_MAX_LENGTH}
            onChange={(e) => setSubtitle(clampText(e.target.value, LESSON_SUBTITLE_MAX_LENGTH))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Description</Label>
          <RichTextEditor value={body} onChange={setBody} placeholder="Provide a detailed description..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">
            <Video className="mr-2 inline h-4 w-4" />
            YouTube Video URL
          </Label>
          <Input
            id="videoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              <LinkIcon className="mr-2 inline h-4 w-4" />
              Additional Resources
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addLink}>
              <Plus className="mr-1 h-4 w-4" />
              Add Resource
            </Button>
          </div>

          {links.map((link) => {
            const { icon: ProviderIcon } = getProviderMeta(link.providerSlug)
            return (
              <Card key={link.id} className="p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <ProviderIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Resource title"
                      value={link.title}
                      onChange={(e) => updateLink(link.id, "title", e.target.value)}
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateLink(link.id, "url", e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(link.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderModulesOverviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Lesson Modules</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Add modules to your lesson. Each module is a sub-page with content, videos, resources, and homework.
        </p>
      </div>

      <div className="space-y-3">
        {modules.map((moduleItem, index) => (
          <Card key={moduleItem.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Module {index + 1}: {moduleItem.title || "Untitled Module"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {moduleItem.resources.length} resources • {moduleItem.formFields.length} homework fields
                </p>
              </div>
              {!isEditMode ? (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(index)}>
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </Card>
        ))}

        {!isEditMode ? (
          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={addModule}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        ) : null}
      </div>
    </div>
  )

  const renderModuleStep = () => {
    const activeModule = modules[currentModuleIndex]
    if (!activeModule) return null

    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Module {currentModuleIndex + 1}</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Configure the content, resources, and homework for this module.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Module Title *</Label>
              <span className="text-xs text-muted-foreground">
                {activeModule.title.length}/{MODULE_TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              placeholder="Getting Started with HTML"
              value={activeModule.title}
              maxLength={MODULE_TITLE_MAX_LENGTH}
              onChange={(e) => updateModule(currentModuleIndex, "title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Subtitle</Label>
              <span className="text-xs text-muted-foreground">
                {activeModule.subtitle.length}/{MODULE_SUBTITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              placeholder="Learn the basics of HTML structure"
              value={activeModule.subtitle}
              maxLength={MODULE_SUBTITLE_MAX_LENGTH}
              onChange={(e) => updateModule(currentModuleIndex, "subtitle", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={activeModule.body}
              onChange={(value) => updateModule(currentModuleIndex, "body", value)}
              placeholder="Module content and instructions..."
            />
          </div>

          <div className="space-y-2">
            <Label>
              <Video className="mr-2 inline h-4 w-4" />
              Video URL
            </Label>
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={activeModule.videoUrl}
              onChange={(e) => updateModule(currentModuleIndex, "videoUrl", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                <FileText className="mr-2 inline h-4 w-4" />
                Resources
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addResource(currentModuleIndex)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Resource
              </Button>
            </div>

            {activeModule.resources.map((resource) => {
              const { icon: ResourceIcon } = getProviderMeta(resource.providerSlug)
              return (
                <Card key={resource.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Resource title"
                        value={resource.title}
                        onChange={(e) => updateResource(currentModuleIndex, resource.id, "title", e.target.value)}
                      />
                      <Input
                        placeholder="https://..."
                        value={resource.url}
                        onChange={(e) => updateResource(currentModuleIndex, resource.id, "url", e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeResource(currentModuleIndex, resource.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Student Homework Form</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addFormField(currentModuleIndex)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Field
              </Button>
            </div>

            {activeModule.formFields.map((field) => {
              const typeMeta = FORM_FIELD_TYPE_OPTIONS.find((option) => option.value === field.type)
              const optionsValue = optionsToTextareaValue(field.options)
              const showOptions = field.type === "select" || field.type === "multi_select"
              const showSlider = field.type === "slider"
              const showProgram = field.type === "custom_program"
              const showRequiredToggle = field.type !== "subtitle"
              const showPlaceholder = field.type === "short_text" || field.type === "long_text"

              return (
                <Card key={field.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                          {typeMeta?.label ?? field.type.replace(/_/g, " ")}
                        </span>
                        <select
                          className="flex h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-9 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          value={field.type}
                          onChange={(e) =>
                            updateFormField(currentModuleIndex, field.id, (current) =>
                              normalizeFieldForType(current, e.target.value as FormFieldType),
                            )
                          }
                        >
                          {FORM_FIELD_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>{field.type === "subtitle" ? "Subtitle heading" : "Field label"}</Label>
                        <Input
                          placeholder={field.type === "subtitle" ? "Section title" : "Field label"}
                          value={field.label}
                          onChange={(e) =>
                            updateFormField(currentModuleIndex, field.id, (current) => ({
                              ...current,
                              label: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {showPlaceholder ? (
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            placeholder="Placeholder text"
                            value={field.placeholder ?? ""}
                            onChange={(e) =>
                              updateFormField(currentModuleIndex, field.id, (current) => ({
                                ...current,
                                placeholder: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label>{field.type === "subtitle" ? "Supporting text" : "Help text"}</Label>
                        <Textarea
                          placeholder={
                            field.type === "subtitle"
                              ? "Add context for this module section"
                              : "Provide guidance or examples for learners"
                          }
                          value={field.description ?? ""}
                          onChange={(e) =>
                            updateFormField(currentModuleIndex, field.id, (current) => ({
                              ...current,
                              description: e.target.value,
                            }))
                          }
                          rows={field.type === "subtitle" ? 2 : 3}
                        />
                      </div>

                      {showOptions ? (
                        <div className="space-y-2">
                          <Label>Options (one per line)</Label>
                          <Textarea
                            placeholder={"Option one\nOption two\nOption three"}
                            value={optionsValue}
                            onChange={(e) =>
                              updateFormField(currentModuleIndex, field.id, (current) => ({
                                ...current,
                                options: parseOptions(e.target.value),
                              }))
                            }
                            rows={4}
                          />
                        </div>
                      ) : null}

                      {showSlider ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {["min", "max", "step"].map((key) => (
                            <div className="space-y-2" key={key}>
                              <Label className="capitalize">{key}</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                placeholder={String(DEFAULT_SLIDER_RANGE[key as keyof typeof DEFAULT_SLIDER_RANGE])}
                                value={
                                  key === "min"
                                    ? field.min ?? ""
                                    : key === "max"
                                      ? field.max ?? ""
                                      : field.step ?? ""
                                }
                                onChange={(e) =>
                                  updateFormField(currentModuleIndex, field.id, (current) => ({
                                    ...current,
                                    [key]: e.target.value === "" ? null : Number(e.target.value),
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {showProgram ? (
                        <div className="space-y-2">
                          <Label>Program instructions</Label>
                          <Textarea
                            placeholder="Describe how the learner should build their custom program..."
                            value={field.programTemplate ?? ""}
                            onChange={(e) =>
                              updateFormField(currentModuleIndex, field.id, (current) => ({
                                ...current,
                                programTemplate: e.target.value,
                              }))
                            }
                            rows={4}
                          />
                        </div>
                      ) : null}

                      {showRequiredToggle ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateFormField(currentModuleIndex, field.id, (current) => ({
                                ...current,
                                required: e.target.checked,
                              }))
                            }
                            className="rounded border-input"
                          />
                          Required
                        </label>
                      ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFormField(currentModuleIndex, field.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          if (!next) {
            resetWizard()
          }
          onOpenChange(next)
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl sm:max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Lesson</DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="py-4">
          {step === 1 ? renderLandingPageStep() : null}
          {step === 2 ? renderModulesOverviewStep() : null}
          {step >= 3 ? renderModuleStep() : null}
        </div>

        {error ? <p className="pb-2 text-sm text-rose-500">{error}</p> : null}

        <div className="flex justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || pending}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            {step < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={pending}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={pending}>
                {pending ? "Creating…" : (
                  <span className="flex items-center">
                    <Check className="mr-1 h-4 w-4" />
                    Create Lesson
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
