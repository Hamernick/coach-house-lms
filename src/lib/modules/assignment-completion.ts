import type {
  ModuleAssignmentCompletionMode,
  ModuleAssignmentField,
} from "./types"

export type AssignmentCompletionInput = {
  completeOnSubmit: boolean
  completionMode: ModuleAssignmentCompletionMode
  fields: ModuleAssignmentField[]
  answers: Record<string, unknown> | null | undefined
  status?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeHtmlText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function hasTextAnswer(value: unknown) {
  if (typeof value !== "string") return false
  return normalizeHtmlText(value).length > 0
}

export function parseAssignmentCompletionMode(
  schema: unknown,
): ModuleAssignmentCompletionMode {
  if (!isRecord(schema)) return "on_submit"
  const raw = schema.completion_mode ?? schema.completionMode
  if (raw === "all_answered" || raw === "allAnswered") return "all_answered"
  return "on_submit"
}

export function isAssignmentFieldAnswerable(field: ModuleAssignmentField) {
  return field.type !== "subtitle"
}

export function isAssignmentFieldAnswered(
  field: ModuleAssignmentField,
  answers: Record<string, unknown> | null | undefined,
) {
  const value = answers?.[field.name]
  if (value === null || value === undefined) return false

  switch (field.type) {
    case "short_text":
    case "long_text":
    case "custom_program":
      return hasTextAnswer(value)
    case "select":
      return typeof value === "string" && value.trim().length > 0
    case "multi_select":
      return Array.isArray(value) && value.some((item) => hasTextAnswer(item))
    case "slider":
      return typeof value === "number" && Number.isFinite(value)
    case "budget_table":
      if (!Array.isArray(value)) return false
      return value.some((row) => {
        if (!isRecord(row)) return hasTextAnswer(row)
        return Object.values(row).some((entry) => hasTextAnswer(entry))
      })
    case "subtitle":
      return false
    default:
      return Boolean(value)
  }
}

export function areAssignmentAnswerableFieldsComplete({
  fields,
  answers,
}: Pick<AssignmentCompletionInput, "fields" | "answers">) {
  const answerableFields = fields.filter(isAssignmentFieldAnswerable)
  return (
    answerableFields.length > 0 &&
    answerableFields.every((field) => isAssignmentFieldAnswered(field, answers))
  )
}

export function shouldTreatAssignmentSubmissionAsComplete({
  completeOnSubmit,
  completionMode,
  fields,
  answers,
  status,
}: AssignmentCompletionInput) {
  if (!completeOnSubmit) return false
  if (!status || status === "revise") return false
  if (status === "accepted") return true
  if (completionMode === "all_answered") {
    return areAssignmentAnswerableFieldsComplete({ fields, answers })
  }
  return true
}
