import type { LessonWizardPayload } from "./types"
import { toNumberOrNull } from "./fields"

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function buildResourcePayload(
  resources: LessonWizardPayload["modules"][number]["resources"],
  lessonLinks: LessonWizardPayload["links"],
): Array<{ label: string; url: string }> {
  const items: Array<{ label: string; url: string }> = []
  for (const link of lessonLinks ?? []) {
    const url = typeof link?.url === "string" ? link.url.trim() : ""
    if (!url) continue
    const label = typeof link?.title === "string" && link.title.trim().length > 0 ? link.title.trim() : url
    items.push({ label, url })
  }
  for (const resource of resources ?? []) {
    if (!resource) continue
    const url = typeof resource.url === "string" ? resource.url.trim() : ""
    if (!url) continue
    const label = typeof resource.title === "string" && resource.title.trim().length > 0 ? resource.title.trim() : url
    items.push({ label, url })
  }
  return items
}

export function buildAssignmentSchema(
  formFields: LessonWizardPayload["modules"][number]["formFields"],
): { fields: Array<Record<string, unknown>> } | null {
  if (!Array.isArray(formFields) || formFields.length === 0) return null

  const fields: Array<Record<string, unknown>> = []
  const usedNames = new Set<string>()

  formFields.forEach((field, index) => {
    if (!field) return
    const normalizedType = field.type

    const rawLabel = typeof field.label === "string" ? field.label.trim() : ""
    const hasLabel = rawLabel.length > 0
    if (!hasLabel && normalizedType !== "subtitle") return

    const baseSlug = slugify(hasLabel ? rawLabel : `subtitle_${index + 1}`).replace(/-/g, "_") || `field_${index + 1}`
    let name = baseSlug
    let attempt = 1
    while (usedNames.has(name)) {
      name = `${baseSlug}_${attempt}`
      attempt += 1
    }
    usedNames.add(name)

    const placeholder = typeof field.placeholder === "string" ? field.placeholder.trim() : ""
    const description = typeof field.description === "string" ? field.description.trim() : ""
    const options = Array.isArray(field.options)
      ? field.options.map((option) => String(option).trim()).filter(Boolean)
      : []
    const minRaw = toNumberOrNull(field.min)
    const maxRaw = toNumberOrNull(field.max)
    const stepRaw = toNumberOrNull(field.step)
    const programTemplate = typeof field.programTemplate === "string" ? field.programTemplate.trim() : ""

    if (normalizedType === "subtitle") {
      fields.push({
        name,
        type: "display",
        variant: "subtitle",
        label: rawLabel || `Section ${index + 1}`,
        description: description || undefined,
      })
      return
    }

    const entry: Record<string, unknown> = {
      name,
      label: rawLabel,
      type: normalizedType,
      required: Boolean(field.required),
    }

    if (placeholder) entry.placeholder = placeholder
    if (description) entry.description = description

    if (normalizedType === "select" || normalizedType === "multi_select") {
      if (options.length > 0) entry.options = options
    }

    if (normalizedType === "slider") {
      const resolvedMin = minRaw ?? 0
      let resolvedMax = maxRaw ?? resolvedMin + 100
      if (resolvedMax < resolvedMin) resolvedMax = resolvedMin
      const resolvedStep = stepRaw && stepRaw > 0 ? stepRaw : 1
      entry.min = resolvedMin
      entry.max = resolvedMax
      entry.step = resolvedStep
    }

    if (normalizedType === "custom_program") {
      if (programTemplate) entry.programTemplate = programTemplate
    }

    fields.push(entry)
  })

  if (fields.length === 0) return null
  return { fields }
}

