import type { ModuleAssignmentField } from "@/lib/modules"

import type { AnswersPayload, AssignmentSchema, SanitizedResult } from "./types"

export function extractOrgKeyMappings(schema: unknown): Record<string, string> {
  const mapping: Record<string, string> = {}
  if (!schema || typeof schema !== "object") return mapping

  const fields = Array.isArray((schema as AssignmentSchema).fields)
    ? ((schema as AssignmentSchema).fields as AssignmentSchema["fields"])
    : []

  for (const field of fields ?? []) {
    if (!field || typeof field !== "object") continue
    const nameRaw = field.name
    const orgKeyRaw = (field.org_key ?? field.orgKey) as unknown
    if (typeof nameRaw !== "string" || nameRaw.trim().length === 0) continue
    if (typeof orgKeyRaw !== "string" || orgKeyRaw.trim().length === 0) continue
    const name = nameRaw.trim()
    const orgKey = orgKeyRaw.trim()
    mapping[name] = orgKey
  }

  return mapping
}

export function sanitizeAnswers(fields: ModuleAssignmentField[], raw: AnswersPayload): SanitizedResult {
  if (!raw || typeof raw !== "object") {
    return {
      answers: {},
      missingRequired: fields
        .filter((field) => field.required && field.type !== "subtitle")
        .map((field) => field.label || field.name),
    }
  }

  const result: Record<string, unknown> = {}
  const missingRequired: string[] = []
  const seen = new Set<string>()

  for (const field of fields) {
    if (field.type === "subtitle") {
      continue
    }

    const key = field.name
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)

    const value = raw[key]

    switch (field.type) {
      case "short_text":
      case "long_text":
      case "custom_program": {
        if (typeof value === "string") {
          const trimmed = value.trim()
          if (trimmed.length > 0) {
            result[key] = trimmed
          } else if (field.required) {
            missingRequired.push(field.label || key)
          }
        } else if (field.required) {
          missingRequired.push(field.label || key)
        }
        break
      }
      case "select": {
        if (typeof value === "string") {
          const trimmed = value.trim()
          if (!field.options || field.options.length === 0 || field.options.includes(trimmed)) {
            if (trimmed.length > 0) {
              result[key] = trimmed
            } else if (field.required) {
              missingRequired.push(field.label || key)
            }
          }
        } else if (field.required) {
          missingRequired.push(field.label || key)
        }
        break
      }
      case "multi_select": {
        if (Array.isArray(value)) {
          const options = new Set(field.options ?? [])
          const selected = value
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0 && (options.size === 0 || options.has(item)))
          if (selected.length > 0) {
            result[key] = selected
          } else if (field.required) {
            missingRequired.push(field.label || key)
          }
        } else if (field.required) {
          missingRequired.push(field.label || key)
        }
        break
      }
      case "slider": {
        const min = typeof field.min === "number" ? field.min : 0
        const max = typeof field.max === "number" ? field.max : min + 100
        const step = typeof field.step === "number" && field.step > 0 ? field.step : 1
        let numeric: number | null = null
        if (typeof value === "number" && Number.isFinite(value)) {
          numeric = value
        } else if (typeof value === "string") {
          const asNumber = Number(value)
          numeric = Number.isFinite(asNumber) ? asNumber : null
        }
        if (numeric === null) {
          if (field.required) {
            missingRequired.push(field.label || key)
          }
          break
        }
        const clamped = Math.min(Math.max(numeric, min), max)
        const rounded = Math.round(clamped / step) * step
        result[key] = Number.isFinite(rounded) ? rounded : clamped
        break
      }
      case "budget_table": {
        const fallbackRows = Array.isArray(field.rows) ? field.rows : []
        const rawRows = Array.isArray(value) ? value : fallbackRows
        const normalizedRows = (rawRows as Array<Record<string, unknown> | string | null | undefined>)
          .map((row, index) => {
            if (typeof row === "string") {
              const category = row.trim()
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
            if (!row || typeof row !== "object") {
              return {
                category: fallbackRows[index]?.category ?? "",
                description: "",
                costType: "",
                unit: "",
                units: "",
                costPerUnit: "",
                totalCost: "",
              }
            }
            const record = row as Record<string, unknown>
            const fallback = fallbackRows[index]
            const toString = (val: unknown, fallbackValue = "") =>
              typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : fallbackValue
            return {
              category: toString(record.category, fallback?.category ?? ""),
              description: toString(record.description, fallback?.description ?? ""),
              costType: toString(record.costType, fallback?.costType ?? ""),
              unit: toString(record.unit, fallback?.unit ?? ""),
              units: toString(record.units, fallback?.units ?? ""),
              costPerUnit: toString(record.costPerUnit, fallback?.costPerUnit ?? ""),
              totalCost: toString(record.totalCost, fallback?.totalCost ?? ""),
            }
          })

        const hasContent = normalizedRows.some((row) =>
          Object.values(row).some((val) => typeof val === "string" && val.trim().length > 0),
        )

        if (normalizedRows.length > 0) {
          result[key] = normalizedRows
          if (field.required && !hasContent) {
            missingRequired.push(field.label || key)
          }
        } else if (field.required) {
          missingRequired.push(field.label || key)
        }
        break
      }
      default:
        break
    }
  }

  return { answers: result, missingRequired }
}
