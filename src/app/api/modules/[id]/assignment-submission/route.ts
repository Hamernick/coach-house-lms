import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { markModuleCompleted, parseAssignmentFields, type ModuleAssignmentField } from "@/lib/modules"

type SubmissionStatus = Database["public"]["Enums"]["submission_status"]

type AnswersPayload = Record<string, unknown>

type SanitizedResult = {
  answers: Record<string, unknown>
  missingRequired: string[]
}

function sanitizeAnswers(fields: ModuleAssignmentField[], raw: AnswersPayload): SanitizedResult {
  if (!raw || typeof raw !== "object") {
    return { answers: {}, missingRequired: fields.filter((f) => f.required && f.type !== "subtitle").map((f) => f.label || f.name) }
  }

  const result: Record<string, unknown> = {}
  const missingRequired: string[] = []
  const seen = new Set<string>()

  fields.forEach((field) => {
    if (field.type === "subtitle") {
      return
    }

    const key = field.name
    if (!key || seen.has(key)) {
      return
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
      default:
        break
    }
  })

  return { answers: result, missingRequired }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = await context.params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { answers?: AnswersPayload; status?: SubmissionStatus }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const desiredStatus: SubmissionStatus = "submitted"
  const answersRaw = (payload.answers ?? {}) as AnswersPayload

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("module_assignments" satisfies keyof Database["public"]["Tables"])
    .select("schema, complete_on_submit")
    .eq("module_id", moduleId)
    .maybeSingle<{ schema: unknown; complete_on_submit: boolean | null }>()

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (!assignmentRow) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  const fields = parseAssignmentFields(assignmentRow.schema)
  const { answers: sanitizedAnswers, missingRequired } = sanitizeAnswers(fields, answersRaw)

  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required answers",
        missing: missingRequired,
      },
      { status: 400 },
    )
  }

  const upsertPayload: Database["public"]["Tables"]["assignment_submissions"]["Insert"] = {
    module_id: moduleId,
    user_id: user.id,
    answers: sanitizedAnswers,
    status: desiredStatus,
  }

  const { data: submissionRows, error: upsertError } = await supabase
    .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload, { onConflict: "module_id,user_id" })
    .select("module_id, answers, status, updated_at")
    .maybeSingle<{ module_id: string; answers: Record<string, unknown>; status: SubmissionStatus; updated_at: string | null }>()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  if (assignmentRow.complete_on_submit) {
    try {
      await markModuleCompleted({ moduleId, userId: user.id })
    } catch (completionError) {
      // Surface as non-fatal so submission still succeeds
      console.error("Failed to mark module complete", completionError)
    }
  }

  return NextResponse.json({
    status: submissionRows?.status ?? desiredStatus,
    answers: submissionRows?.answers ?? sanitizedAnswers,
    updatedAt: submissionRows?.updated_at ?? null,
    completeOnSubmit: Boolean(assignmentRow.complete_on_submit),
  })
}
