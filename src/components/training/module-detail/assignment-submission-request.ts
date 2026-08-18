import type { ModuleAssignmentField } from "@/lib/modules"

import {
  assignmentValuesEqual,
  buildAssignmentValues,
  type AssignmentValues,
} from "./utils"

type AssignmentSubmissionPayload = {
  answers?: Record<string, unknown> | null
  status?: string | null
  updatedAt?: string | null
  completeOnSubmit?: boolean
  submissionSaved?: boolean
  warning?: string | null
  error?: string | null
  missing?: unknown
}

export type AssignmentSubmissionResult =
  | {
      saved: true
      answers: Record<string, unknown>
      status: string
      updatedAt: string | null
      completeOnSubmit: boolean
      message: string
    }
  | {
      saved: false
      error: string
    }

type SubmitAssignmentParams = {
  assignmentFields: ModuleAssignmentField[]
  fetcher?: typeof fetch
  moduleId: string
  values: AssignmentValues
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

async function readPayload(
  response: Response
): Promise<AssignmentSubmissionPayload | null> {
  try {
    const payload: unknown = await response.json()
    return isRecord(payload) ? (payload as AssignmentSubmissionPayload) : null
  } catch {
    return null
  }
}

function normalizeForComparison(value: unknown): unknown {
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) return value.map(normalizeForComparison)
  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      normalizeForComparison(entry),
    ])
  )
}

function persistedAnswersMatch({
  assignmentFields,
  attemptedValues,
  persistedAnswers,
}: {
  assignmentFields: ModuleAssignmentField[]
  attemptedValues: AssignmentValues
  persistedAnswers: Record<string, unknown>
}) {
  const attempted = normalizeForComparison(
    buildAssignmentValues(assignmentFields, attemptedValues)
  ) as AssignmentValues
  const persisted = normalizeForComparison(
    buildAssignmentValues(assignmentFields, persistedAnswers)
  ) as AssignmentValues
  return assignmentValuesEqual(attempted, persisted)
}

function savedResult({
  payload,
  values,
  message,
}: {
  payload: AssignmentSubmissionPayload | null
  values: AssignmentValues
  message?: string
}): AssignmentSubmissionResult {
  return {
    saved: true,
    answers:
      payload?.answers && isRecord(payload.answers) ? payload.answers : values,
    status: typeof payload?.status === "string" ? payload.status : "submitted",
    updatedAt:
      typeof payload?.updatedAt === "string" ? payload.updatedAt : null,
    completeOnSubmit: Boolean(payload?.completeOnSubmit),
    message:
      message ??
      (typeof payload?.warning === "string" && payload.warning.trim()
        ? payload.warning
        : "Saved."),
  }
}

function responseError(payload: AssignmentSubmissionPayload | null) {
  if (Array.isArray(payload?.missing) && payload.missing.length > 0) {
    return `Please complete: ${payload.missing.join(", ")}`
  }
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error
  }
  return "Unable to save. Your answers remain on this device; try again."
}

async function recoverPersistedSubmission({
  assignmentFields,
  fetcher,
  moduleId,
  values,
}: Required<
  Pick<SubmitAssignmentParams, "assignmentFields" | "moduleId" | "values">
> & {
  fetcher: typeof fetch
}): Promise<AssignmentSubmissionResult | null> {
  try {
    const response = await fetcher(
      `/api/modules/${moduleId}/assignment-submission`,
      {
        method: "GET",
        cache: "no-store",
      }
    )
    if (!response.ok) return null

    const payload = await readPayload(response)
    if (
      !payload?.answers ||
      !isRecord(payload.answers) ||
      !persistedAnswersMatch({
        assignmentFields,
        attemptedValues: values,
        persistedAnswers: payload.answers,
      })
    ) {
      return null
    }

    return savedResult({
      payload,
      values,
      message: "Saved. Verified after a connection interruption.",
    })
  } catch {
    return null
  }
}

export async function submitAssignmentWithRecovery({
  assignmentFields,
  fetcher = fetch,
  moduleId,
  values,
}: SubmitAssignmentParams): Promise<AssignmentSubmissionResult> {
  let response: Response
  try {
    response = await fetcher(`/api/modules/${moduleId}/assignment-submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: values }),
    })
  } catch {
    return (
      (await recoverPersistedSubmission({
        assignmentFields,
        fetcher,
        moduleId,
        values,
      })) ?? {
        saved: false,
        error: "Unable to save. Your answers remain on this device; try again.",
      }
    )
  }

  const payload = await readPayload(response)
  if (response.ok) {
    if (payload) return savedResult({ payload, values })
    return (
      (await recoverPersistedSubmission({
        assignmentFields,
        fetcher,
        moduleId,
        values,
      })) ?? {
        saved: false,
        error:
          "Unable to verify the save. Your answers remain on this device; try again.",
      }
    )
  }

  if (payload?.submissionSaved) {
    return savedResult({
      payload,
      values,
      message:
        typeof payload.error === "string" && payload.error.trim()
          ? payload.error
          : "Saved. Organization details could not update.",
    })
  }

  if (response.status >= 500) {
    const recovered = await recoverPersistedSubmission({
      assignmentFields,
      fetcher,
      moduleId,
      values,
    })
    if (recovered) return recovered
  }

  return { saved: false, error: responseError(payload) }
}
