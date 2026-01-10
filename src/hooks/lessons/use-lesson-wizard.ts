"use client"

import { useCallback, useEffect, useMemo, useRef, useReducer, useState } from "react"
import { LESSON_SUBTITLE_MAX_LENGTH, LESSON_TITLE_MAX_LENGTH, MODULE_SUBTITLE_MAX_LENGTH, MODULE_TITLE_MAX_LENGTH, clampText } from "@/lib/lessons/limits"
import { DEFAULT_SLIDER_RANGE, MAX_CLASS_LINKS } from "@/lib/lessons/constants"
import { createDefaultFormField, normalizeFieldForType, normalizeFormFieldType, toNumberOrNull } from "@/lib/lessons/fields"
import { inferProviderSlug } from "@/lib/lessons/providers"
import type { FormField, LessonWizardPayload, ModuleDefinition } from "@/lib/lessons/types"
import { initialWizardData, wizardReducer } from "./wizard-reducer"
import { normalizeIncomingPayload, validateFinalPayload } from "@/lib/lessons/schemas"

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export type WizardParams = {
  open: boolean
  mode?: "create" | "edit"
  initialPayload?: LessonWizardPayload | null
  focusModuleId?: string | null
}

export function useLessonWizard({ open, mode = "create", initialPayload = null, focusModuleId = null }: WizardParams) {
  const isEditMode = mode === "edit"

  // Steps
  const [step, setStep] = useState(1)

  // Landing
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [body, setBody] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [data, dispatch] = useReducer(wizardReducer, initialWizardData)
  const { links, modules } = data
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [pendingModuleFocus, setPendingModuleFocus] = useState<string | null>(null)

  const focusModuleRef = useRef<string | null>(null)
  const totalSteps = useMemo(() => 2 + modules.length, [modules.length])

  const [error, setError] = useState<string | null>(null)

  // Dirty tracking
  const initialSignatureRef = useRef<string | null>(null)

  const buildNormalizedFromState = useCallback(() => {
    return {
      title: clampText(title.trim(), LESSON_TITLE_MAX_LENGTH),
      subtitle: clampText(subtitle.trim(), LESSON_SUBTITLE_MAX_LENGTH),
      body,
      videoUrl: videoUrl.trim(),
      links: links.map((l) => ({
        title: l.title.trim(),
        url: l.url.trim(),
        provider: l.providerSlug,
      })),
      modules: modules.map((m) => ({
        moduleId: m.moduleId ?? null,
        title: clampText(m.title.trim(), MODULE_TITLE_MAX_LENGTH),
        subtitle: clampText(m.subtitle.trim(), MODULE_SUBTITLE_MAX_LENGTH),
        body: m.body,
        videoUrl: m.videoUrl.trim(),
        resources: m.resources.map((r) => ({
          title: r.title.trim(),
          url: (r.url ?? "").trim(),
          provider: r.providerSlug,
        })),
        formFields: m.formFields.map((f) => {
          const opts = Array.isArray(f.options) ? f.options.map((o) => String(o).trim()).filter(Boolean) : []
          return ({
            label: f.label.trim(),
            type: f.type,
            required: f.type === "subtitle" ? false : Boolean(f.required),
            placeholder: (f.placeholder ?? "").trim() || undefined,
            description: (f.description ?? "").trim() || undefined,
            options: f.type === "select" || f.type === "multi_select" ? (opts.length > 0 ? opts : undefined) : undefined,
            min: f.type === "slider" ? toNumberOrNull(f.min) : undefined,
            max: f.type === "slider" ? toNumberOrNull(f.max) : undefined,
            step: f.type === "slider" ? toNumberOrNull(f.step) : undefined,
            programTemplate: f.type === "custom_program" ? (f.programTemplate ?? "") : undefined,
          })
        }),
      })),
    }
  }, [title, subtitle, body, videoUrl, links, modules])

  // Capture initial signature for edit mode comparisons
  useEffect(() => {
    if (!open || !isEditMode || !initialPayload) {
      initialSignatureRef.current = null
      return
    }
    initialSignatureRef.current = JSON.stringify(normalizeIncomingPayload(initialPayload))
  }, [open, isEditMode, initialPayload])

  const currentSignature = useMemo(() => JSON.stringify(buildNormalizedFromState()), [buildNormalizedFromState])
  const isDirty = useMemo(() => {
    if (!isEditMode) return true
    if (!initialSignatureRef.current) return false
    return currentSignature !== initialSignatureRef.current
  }, [currentSignature, isEditMode])

  const resetWizard = useCallback(() => {
    setStep(1)
    setTitle("")
    setSubtitle("")
    setBody("")
    setVideoUrl("")
    dispatch({ type: "RESET" })
    setCurrentModuleIndex(0)
    setError(null)
    focusModuleRef.current = null
  }, [])

  const applyPayloadToState = useCallback((payload: LessonWizardPayload) => {
    setTitle(clampText(payload.title ?? "", LESSON_TITLE_MAX_LENGTH))
    setSubtitle(clampText(payload.subtitle ?? "", LESSON_SUBTITLE_MAX_LENGTH))
    setBody(payload.body ?? "")
    setVideoUrl(payload.videoUrl ?? "")
    const nextLinks = (payload.links ?? []).map((link) => ({
      id: makeId(),
      title: link.title ?? "",
      url: link.url ?? "",
      providerSlug: inferProviderSlug(link.url),
    }))
    const nextModules = (payload.modules ?? []).map((module) => ({
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
        const rawOptions = Array.isArray(field.options) ? field.options : []
        const options = type === "budget_table"
          ? rawOptions
          : rawOptions
              .filter((option): option is string => typeof option === "string")
              .map((option) => option.trim())
              .filter(Boolean)
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

    const focusTarget = focusModuleRef.current
    const focusIndex = focusTarget
      ? nextModules.findIndex((module) => module.moduleId === focusTarget || module.id === focusTarget)
      : -1
    const nextStep = focusIndex >= 0 ? Math.min(3 + focusIndex, 2 + nextModules.length) : 1

    dispatch({ type: "SET_ALL", payload: { links: nextLinks, modules: nextModules } })
    setCurrentModuleIndex(focusIndex >= 0 ? focusIndex : 0)
    setStep(nextStep)
    if (focusIndex >= 0) {
      setPendingModuleFocus(null)
    } else if (focusTarget) {
      setPendingModuleFocus(focusTarget)
    }
    setError(null)
  }, [])

  // Initialize on open
  useEffect(() => {
    if (!open) return
    if (isEditMode) {
      if (initialPayload) applyPayloadToState(initialPayload)
    } else {
      resetWizard()
    }
  }, [open, isEditMode, initialPayload, applyPayloadToState, resetWizard])

  // Focus module handling
  useEffect(() => {
    if (!open) {
      setPendingModuleFocus(null)
      return
    }
    focusModuleRef.current = focusModuleId ?? null
    if (focusModuleId) setPendingModuleFocus(focusModuleId)
    else setPendingModuleFocus(null)
  }, [focusModuleId, open])

  useEffect(() => {
    if (!open || !pendingModuleFocus) return
    const index = modules.findIndex(
      (m) => m.moduleId === pendingModuleFocus || m.id === pendingModuleFocus,
    )
    if (index === -1) {
      if (modules.length > 0) setPendingModuleFocus(null)
      return
    }
    const moduleStep = Math.min(3 + index, 2 + modules.length)
    setCurrentModuleIndex((prev) => (prev === index ? prev : index))
    setStep((prev) => (prev === moduleStep ? prev : moduleStep))
    setError(null)
    setPendingModuleFocus(null)
  }, [modules, open, pendingModuleFocus])

  // Link operations
  const addLink = useCallback(() => {
    // Limit to MAX_CLASS_LINKS items
    if (links.length >= MAX_CLASS_LINKS) return
    dispatch({ type: "LINK_ADD" })
  }, [links.length])
  const removeLink = useCallback((id: string) => dispatch({ type: "LINK_REMOVE", payload: { id } }), [])
  const updateLink = useCallback((id: string, field: "title" | "url", value: string) => dispatch({ type: "LINK_UPDATE", payload: { id, field, value } }), [])

  // Module operations
  const addModule = useCallback(() => { if (!isEditMode) dispatch({ type: "MODULE_ADD" }) }, [isEditMode])
  const removeModule = useCallback((index: number) => {
    if (isEditMode) return
    dispatch({ type: "MODULE_REMOVE", payload: { index } })
    setCurrentModuleIndex((prev) => Math.max(0, Math.min(prev, modules.length - 2)))
  }, [isEditMode, modules.length])
  const updateModule = useCallback((index: number, field: keyof ModuleDefinition, value: unknown) => {
    dispatch({ type: "MODULE_UPDATE_FIELD", payload: { index, field, value } })
  }, [])

  // Resource operations
  const addResource = useCallback((moduleIndex: number) => dispatch({ type: "RESOURCE_ADD", payload: { moduleIndex } }), [])
  const removeResource = useCallback((moduleIndex: number, resourceId: string) => dispatch({ type: "RESOURCE_REMOVE", payload: { moduleIndex, resourceId } }), [])
  const updateResource = useCallback((moduleIndex: number, resourceId: string, field: "title" | "url", value: string) => dispatch({ type: "RESOURCE_UPDATE", payload: { moduleIndex, resourceId, field, value } }), [])

  // Field operations
  const addFormField = useCallback((moduleIndex: number) => dispatch({ type: "FIELD_ADD", payload: { moduleIndex } }), [])
  const removeFormField = useCallback((moduleIndex: number, fieldId: string) => dispatch({ type: "FIELD_REMOVE", payload: { moduleIndex, fieldId } }), [])
  const updateFormField = useCallback((moduleIndex: number, fieldId: string, updater: (current: FormField) => FormField) => dispatch({ type: "FIELD_UPDATE", payload: { moduleIndex, fieldId, apply: updater } }), [])

  // Navigation
  const handleBack = useCallback(() => {
    if (step === 1) return
    if (step === 3 && totalSteps === 3) {
      setStep(2)
      return
    }
    setStep((p) => Math.max(1, p - 1))
    if (step > 2) setCurrentModuleIndex((p) => Math.max(0, p - 1))
  }, [step, totalSteps])

  const lessonTitle = clampText(title.trim(), LESSON_TITLE_MAX_LENGTH)
  const lessonSubtitle = clampText(subtitle.trim(), LESSON_SUBTITLE_MAX_LENGTH)

  const handleNext = useCallback(() => {
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
  }, [step, totalSteps, modules, currentModuleIndex, isEditMode, addModule, lessonTitle])

  // Final payload builder + validation
  const buildFinalPayload = useCallback((): { payload?: LessonWizardPayload; error?: string } => {
    if (!lessonTitle) return { error: "Lesson title is required." }
    if (!isEditMode && modules.length === 0)
      return { error: "Add at least one module before creating the lesson." }
    const missingModuleIndex = modules.findIndex((m) => m.title.trim().length === 0)
    if (missingModuleIndex !== -1) return { error: `Module ${missingModuleIndex + 1} is missing a title.` }

    const payload: LessonWizardPayload = {
      title: lessonTitle,
      subtitle: lessonSubtitle,
      body,
      videoUrl: videoUrl.trim(),
      links: links
        .map((link) => ({ title: link.title.trim(), url: link.url.trim(), provider: link.providerSlug }))
        .filter((l) => l.title.length > 0 || l.url.length > 0),
      modules: modules.map((m) => ({
        moduleId: m.moduleId,
        title: clampText(m.title.trim(), MODULE_TITLE_MAX_LENGTH),
        subtitle: clampText(m.subtitle.trim(), MODULE_SUBTITLE_MAX_LENGTH),
        body: m.body,
        videoUrl: m.videoUrl.trim(),
        resources: m.resources.map((r) => ({ title: r.title.trim(), type: "link", url: r.url.trim() || null, provider: r.providerSlug })),
        formFields: m.formFields.map((f) => {
          const rawOptions = Array.isArray(f.options) ? f.options : []
          const options =
            f.type === "budget_table"
              ? rawOptions.filter(
                  (opt): opt is { category: string; description?: string; costType?: string; unit?: string } =>
                    typeof opt === "object" && opt !== null && "category" in opt,
                )
              : rawOptions
                  .filter((opt): opt is string => typeof opt === "string")
                  .map((opt) => opt.trim())
                  .filter(Boolean)
          const placeholder = f.placeholder?.trim() ?? ""
          const description = f.description?.trim() ?? ""
          const min = toNumberOrNull(f.min)
          const max = toNumberOrNull(f.max)
          const step = toNumberOrNull(f.step)
          return {
            label: f.label.trim(),
            type: f.type,
            required: f.type === "subtitle" ? false : f.required,
            placeholder: placeholder || undefined,
            description: description || undefined,
            options: f.type === "select" || f.type === "multi_select" ? (options.length > 0 ? options : undefined) : undefined,
            min: f.type === "slider" ? (min ?? DEFAULT_SLIDER_RANGE.min) : undefined,
            max: f.type === "slider" ? (max ?? DEFAULT_SLIDER_RANGE.max) : undefined,
            step: f.type === "slider" ? (step ?? DEFAULT_SLIDER_RANGE.step) : undefined,
            programTemplate: f.type === "custom_program" ? (f.programTemplate?.trim() ?? "") : undefined,
          }
        }),
      })),
    }
    try {
      const validated = validateFinalPayload(payload)
      return { payload: validated }
    } catch {
      return { error: "Validation failed. Please review your inputs." }
    }
  }, [lessonTitle, lessonSubtitle, body, videoUrl, links, modules, isEditMode])

  return {
    // state
    step, totalSteps, isEditMode, error,
    title, subtitle, body, videoUrl, links, modules, currentModuleIndex,
    // setters
    setTitle, setSubtitle, setBody, setVideoUrl, setError,
    // operations
    addLink, removeLink, updateLink,
    addModule, removeModule, updateModule,
    addResource, removeResource, updateResource,
    addFormField, removeFormField, updateFormField,
    handleBack, handleNext, buildFinalPayload,
    // derived
    isDirty,
    // utils
    resetWizard,
  }
}
