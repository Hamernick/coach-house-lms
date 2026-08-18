"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { deriveAssignmentInitialValues } from "./assignment-form"
import {
  assignmentValuesEqual,
  buildAssignmentValues,
  type AssignmentValues,
} from "./utils"
import type {
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
} from "@/lib/modules"
import { submitAssignmentWithRecovery } from "./assignment-submission-request"

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
      assignmentValuesEqual(prev, initialFormValues) ? prev : initialFormValues
    )
  }, [initialFormValues])

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(
    submission?.status ?? null
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    submission?.updatedAt ?? null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSubmissionStatus(submission?.status ?? null)
    setLastSavedAt(submission?.updatedAt ?? null)
    setMessage(null)
    setError(null)
  }, [submission?.status, submission?.updatedAt, moduleId])

  const handleSubmit = useCallback(
    async (values: AssignmentValues, options?: { silent?: boolean }) => {
      if (assignmentFields.length === 0) return
      const fieldsSnapshot = assignmentFields
      setMessage(null)
      setError(null)
      setIsSubmitting(true)

      try {
        const result = await submitAssignmentWithRecovery({
          assignmentFields: fieldsSnapshot,
          moduleId,
          values,
        })

        if (!result.saved) {
          setError(result.error)
          return false
        }

        const normalizedAnswers = buildAssignmentValues(
          fieldsSnapshot,
          result.answers
        )
        setFormSeed(normalizedAnswers)

        const nextStatus = result.status
        setSubmissionStatus(nextStatus)

        const savedAt = result.updatedAt ?? new Date().toISOString()
        setLastSavedAt(savedAt)

        const autoComplete = result.completeOnSubmit
        if (result.message !== "Saved.") {
          setMessage(result.message)
        } else if (!options?.silent) {
          setMessage(
            autoComplete
              ? "Submission saved — this module is now marked complete."
              : "Submission saved."
          )
        } else {
          setMessage("Saved.")
        }
        setError(null)

        const shouldRefresh =
          autoComplete || (!options?.silent && submissionStatus !== nextStatus)
        if (shouldRefresh) {
          router.refresh()
        }
        return true
      } catch (err) {
        console.error("Assignment submission failed", err)
        setError(
          "Unable to save. Your answers remain on this device; try again."
        )
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [assignmentFields, moduleId, router, submissionStatus]
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
