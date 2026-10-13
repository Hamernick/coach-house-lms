import { toNumberOrNull, normalizeFormFieldTypeLegacy } from "@/lib/lessons/fields"
import type { ModuleAssignmentField, BudgetTableRow } from "./types"

function makeSafeKey(value: string, fallback: string): string {
  const sanitized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return sanitized.length > 0 ? sanitized : fallback
}

function normalizeAssignmentFieldType(
  type: unknown,
  variant?: unknown,
): ModuleAssignmentField["type"] {
  return normalizeFormFieldTypeLegacy(type, variant)
}

function normalizeBudgetRow(raw: unknown): BudgetTableRow | null {
  if (typeof raw === "string") {
    const category = raw.trim()
    if (!category) return null
    return {
      category,
      description: "",
      costType: "",
      unit: "",
      units: "",
      costPerUnit: "",
      totalCost: "",
    }
  }

  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const category = typeof row.category === "string" ? row.category.trim() : ""
  const description = typeof row.description === "string" ? row.description.trim() : ""
  const costType = typeof row.costType === "string" ? row.costType.trim() : ""
  const unit = typeof row.unit === "string" ? row.unit.trim() : ""
  const units = typeof row.units === "string" ? row.units.trim() : ""
  const costPerUnit = typeof row.costPerUnit === "string" ? row.costPerUnit.trim() : ""
  const totalCost = typeof row.totalCost === "string" ? row.totalCost.trim() : ""

  if (
    !category &&
    !description &&
    !costType &&
    !unit &&
    !units &&
    !costPerUnit &&
    !totalCost
  ) {
    return null
  }

  return {
    category,
    description,
    costType,
    unit,
    units,
    costPerUnit,
    totalCost,
  }
}

export function parseAssignmentFields(schema: unknown): ModuleAssignmentField[] {
  if (!schema || typeof schema !== "object") {
    return []
  }

  const fieldsArray = Array.isArray((schema as { fields?: unknown[] }).fields)
    ? ((schema as { fields?: unknown[] }).fields as unknown[])
    : []

  const usedNames = new Set<string>()
  const normalized: ModuleAssignmentField[] = []

  fieldsArray.forEach((field, index) => {
    if (!field || typeof field !== "object") return

    const rawType = (field as { type?: unknown }).type
    const variant = (field as { variant?: unknown }).variant
    const normalizedType = normalizeAssignmentFieldType(rawType, variant)

    const rawName =
      typeof (field as { name?: unknown }).name === "string"
        ? (field as { name: string }).name
        : ""
    const baseKey = makeSafeKey(rawName, `field_${index + 1}`)
    let name = baseKey
    let attempt = 1
    while (usedNames.has(name)) {
      name = `${baseKey}_${attempt}`
      attempt += 1
    }
    usedNames.add(name)

    const rawLabel =
      typeof (field as { label?: unknown }).label === "string"
        ? (field as { label: string }).label
        : ""
    const label = rawLabel.trim().length > 0 ? rawLabel.trim() : name

    const placeholderRaw =
      typeof (field as { placeholder?: unknown }).placeholder === "string"
        ? (field as { placeholder: string }).placeholder
        : ""
    const placeholder =
      placeholderRaw.trim().length > 0 ? placeholderRaw.trim() : undefined

    const descriptionRaw =
      typeof (field as { description?: unknown }).description === "string"
        ? (field as { description: string }).description
        : ""
    const description =
      descriptionRaw.trim().length > 0 ? descriptionRaw.trim() : undefined

    const optionsRaw = Array.isArray((field as { options?: unknown }).options)
      ? ((field as { options: unknown[] }).options as unknown[])
      : []
    const options = optionsRaw
      .map((option) => String(option).trim())
      .filter((option) => option.length > 0)

    const min = toNumberOrNull((field as { min?: unknown }).min)
    const max = toNumberOrNull((field as { max?: unknown }).max)
    const step = toNumberOrNull((field as { step?: unknown }).step)

    const programTemplateRaw =
      typeof (field as { programTemplate?: unknown }).programTemplate ===
      "string"
        ? (field as { programTemplate: string }).programTemplate
        : ""
    const programTemplate =
      programTemplateRaw.trim().length > 0
        ? programTemplateRaw.trim()
        : undefined

    const rowsRaw = Array.isArray((field as { rows?: unknown }).rows)
      ? ((field as { rows: unknown[] }).rows as unknown[])
      : []
    const rows = rowsRaw.map(normalizeBudgetRow).filter((row): row is BudgetTableRow => Boolean(row))

    const required =
      normalizedType === "subtitle"
        ? false
        : Boolean((field as { required?: unknown }).required)

    const orgKeyRaw =
      typeof (field as { org_key?: unknown }).org_key === "string"
        ? (field as { org_key: string }).org_key
        : typeof (field as { orgKey?: unknown }).orgKey === "string"
          ? (field as { orgKey: string }).orgKey
          : ""
    const orgKey = orgKeyRaw.trim().length > 0 ? orgKeyRaw.trim() : undefined

    const roadmapSectionRaw =
      typeof (field as { roadmap_section?: unknown }).roadmap_section === "string"
        ? (field as { roadmap_section: string }).roadmap_section
        : typeof (field as { roadmapSection?: unknown }).roadmapSection === "string"
          ? (field as { roadmapSection: string }).roadmapSection
          : ""
    const roadmapSectionId =
      roadmapSectionRaw.trim().length > 0 ? roadmapSectionRaw.trim() : undefined

    const assistContextRaw =
      typeof (field as { assist_context?: unknown }).assist_context === "string"
        ? (field as { assist_context: string }).assist_context
        : typeof (field as { assistContext?: unknown }).assistContext === "string"
          ? (field as { assistContext: string }).assistContext
          : ""
    const assistContext = assistContextRaw.trim().length > 0 ? assistContextRaw.trim() : undefined

    const assignmentField: ModuleAssignmentField = {
      name,
      label,
      type: normalizedType,
      required,
    }

    if (placeholder) assignmentField.placeholder = placeholder
    if (description) assignmentField.description = description

    if (normalizedType === "select" || normalizedType === "multi_select") {
      if (options.length > 0) {
        assignmentField.options = options
      }
    }

    if (normalizedType === "slider") {
      const resolvedMin = min ?? 0
      let resolvedMax = max ?? resolvedMin + 100
      if (resolvedMax < resolvedMin) {
        resolvedMax = resolvedMin
      }
      const resolvedStep = step && step > 0 ? step : 1
      assignmentField.min = resolvedMin
      assignmentField.max = resolvedMax
      assignmentField.step = resolvedStep
    }

    if (normalizedType === "custom_program" && programTemplate) {
      assignmentField.programTemplate = programTemplate
    }

    if (normalizedType === "budget_table" && rows.length > 0) {
      assignmentField.rows = rows
    }

    if (orgKey) assignmentField.orgKey = orgKey
    if (roadmapSectionId) assignmentField.roadmapSectionId = roadmapSectionId
    if (assistContext) assignmentField.assistContext = assistContext

    normalized.push(assignmentField)
  })

  return normalized
}

// Legacy support for older homework arrays until all content migrates
export function parseLegacyHomework(raw: unknown): ModuleAssignmentField[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const usedNames = new Set<string>()

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const labelRaw =
        typeof (item as { label?: unknown }).label === "string"
          ? (item as { label: string }).label
          : ""
      const labelNormalized = labelRaw.trim()
      const instructionsRaw =
        typeof (item as { instructions?: unknown }).instructions === "string"
          ? (item as { instructions: string }).instructions
          : ""
      const instructionsNormalized = instructionsRaw.trim()
      const hasInstructions = instructionsNormalized.length > 0
      const isGenericLabel =
        labelNormalized.length === 0 ||
        /^homework(\s*\d+)?$/i.test(labelNormalized)

      // If the legacy label is just "Homework" (or similar) but we have
      // concrete instructions, treat the instructions as the visible label
      // so the actual question appears above the textarea.
      const label =
        hasInstructions && isGenericLabel
          ? instructionsNormalized
          : labelNormalized.length > 0
            ? labelNormalized
            : `Homework ${index + 1}`

      const description =
        hasInstructions && isGenericLabel ? undefined : hasInstructions ? instructionsNormalized : undefined
      const uploadRequired = Boolean(
        (item as { upload_required?: unknown }).upload_required,
      )

      const baseKey = makeSafeKey(label, `legacy_homework_${index + 1}`)
      let name = baseKey
      let attempt = 1
      while (usedNames.has(name)) {
        name = `${baseKey}_${attempt}`
        attempt += 1
      }
      usedNames.add(name)

      const field: ModuleAssignmentField = {
        name,
        label,
        type: "long_text",
        required: uploadRequired,
      }
      if (description) {
        field.description = description
      }
      return field
    })
    .filter((value): value is ModuleAssignmentField => Boolean(value))
}
