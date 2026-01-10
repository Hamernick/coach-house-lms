import { DEFAULT_SLIDER_RANGE } from "./constants"
import type { FormField, FormFieldType } from "./types"

export function normalizeFormFieldType(raw: unknown): FormFieldType {
  const value = typeof raw === "string" ? raw : "short_text"
  switch (value) {
    case "short_text":
    case "long_text":
    case "select":
    case "multi_select":
    case "slider":
    case "subtitle":
    case "budget_table":
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

// Legacy/variant-aware normalizer used by API routes that ingest historical shapes
export function normalizeFormFieldTypeLegacy(type: unknown, variant?: unknown): FormFieldType {
  const raw = typeof type === "string" ? type : ""
  switch (raw) {
    case "short_text":
    case "text":
      return "short_text"
    case "long_text":
    case "textarea":
      return "long_text"
    case "select":
      return "select"
    case "multi_select":
      return "multi_select"
    case "slider":
      return "slider"
    case "budget_table":
      return "budget_table"
    case "custom_program":
    case "program_builder":
      return "custom_program"
    case "display":
      return variant === "subtitle" ? "subtitle" : "short_text"
    case "subtitle":
      return "subtitle"
    default:
      return "short_text"
  }
}

export function createDefaultFormField(): FormField {
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

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export function normalizeFieldForType(field: FormField, nextType: FormFieldType): FormField {
  const base: FormField = { ...field, type: nextType }

  switch (nextType) {
    case "short_text":
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
    case "budget_table":
      return {
        ...base,
        required: field.required,
        placeholder: "",
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
      return base
  }
}

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
