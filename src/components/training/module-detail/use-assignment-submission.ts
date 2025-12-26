"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { deriveAssignmentInitialValues } from "./assignment-form"
import {
  assignmentValuesEqual,
  buildAssignmentValues,
  type AssignmentValues,
} from "./utils"
import type { ModuleAssignmentField, ModuleAssignmentSubmission } from "@/lib/modules"

interface UseAssignmentSubmissionProps {
  assignmentFields: ModuleAssignmentField[]
  moduleId: string
  submission?: ModuleAssignmentSubmission | null
}

export function useAssignmentSubmission({
  assignmentFields,
  moduleId,
  submission,
}: UseAssignmentSubmissionProps) {
  const router = useRouter()
  const initialFormValues = useMemo(() => {
    return deriveAssignmentInitialValues(assignmentFields, submission)
  }, [assignmentFields, submission])

  const [formSeed, setFormSeed] = useState<AssignmentValues>(initialFormValues)
  useEffect(() => {
    setFormSeed((prev) =>
      assignmentValuesEqual(prev, initialFormValues) ? prev : initialFormValues,
    )
  }, [initialFormValues])

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(
    submission?.status ?? null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(submission?.updatedAt ?? null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    setSubmissionStatus(submission?.status ?? null)
    setLastSavedAt(submission?.updatedAt ?? null)
    setMessage(null)
    setError(null)
  }, [submission?.status, submission?.updatedAt, moduleId])

  const handleSubmit = useCallback(
    (values: AssignmentValues) => {
      if (assignmentFields.length === 0) return
      const fieldsSnapshot = assignmentFields
      setMessage(null)
      setError(null)

      startTransition(() => {
        ;(async () => {
          try {
            const response = await fetch(`/api/modules/${moduleId}/assignment-submission`, {
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

            const normalizedAnswers = buildAssignmentValues(
              fieldsSnapshot,
              data.answers ?? null,
            )
            setFormSeed(normalizedAnswers)

            const nextStatus = (data.status ?? "submitted") as string
            setSubmissionStatus(nextStatus)

            const savedAt = data.updatedAt ?? new Date().toISOString()
            setLastSavedAt(savedAt)

            const autoComplete = Boolean(data.completeOnSubmit)
            setMessage(
              autoComplete
                ? "Submission saved — this module is now marked complete."
                : "Submission saved.",
            )
            setError(null)

            router.refresh()
          } catch (err) {
            console.error("Assignment submission failed", err)
            setError("Unable to submit assignment. Please try again.")
          }
        })()
      })
    },
    [assignmentFields, moduleId, router],
  )

  const statusMeta = useMemo(() => {
    switch (submissionStatus) {
      case "accepted":
        return {
          label: "Accepted",
          variant: "default" as const,
          note: "Submission accepted.",
        }
      case "revise":
        return {
          label: "Needs revision",
          variant: "destructive" as const,
          note: "Updates requested — please revise and resubmit.",
        }
      case "submitted":
        return {
          label: "Submitted",
          variant: "secondary" as const,
          note: null,
        }
      default:
        return null
    }
  }, [submissionStatus])

  return {
    formSeed,
    handleSubmit,
    isSubmitting,
    lastSavedAt,
    message,
    statusMeta,
    submissionError: error,
  }
}
