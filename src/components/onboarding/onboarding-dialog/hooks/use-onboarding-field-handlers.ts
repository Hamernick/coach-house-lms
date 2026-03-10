import { useCallback } from "react"

import { slugify } from "../helpers"
import type { FormationStatus, IntentFocus, RoleInterest } from "../types"

type UseOnboardingFieldHandlersProps = {
  formRef: React.RefObject<HTMLFormElement | null>
  slugEdited: boolean
  saveDraft: (
    extra?: Partial<{
      step: number
      formationStatus: FormationStatus | ""
      intentFocus: IntentFocus | ""
      roleInterest: RoleInterest | ""
      slugEdited: boolean
      avatar: string | null
    }>,
  ) => void
  syncProgress: () => void
  setIntentFocus: React.Dispatch<React.SetStateAction<IntentFocus | "">>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setOrgNameValue: React.Dispatch<React.SetStateAction<string>>
  setSlugValue: React.Dispatch<React.SetStateAction<string>>
  setOrgSlugInputValue: React.Dispatch<React.SetStateAction<string>>
  setSlugEdited: React.Dispatch<React.SetStateAction<boolean>>
  setFormationStatus: React.Dispatch<React.SetStateAction<FormationStatus | "">>
}

export function useOnboardingFieldHandlers({
  formRef,
  slugEdited,
  saveDraft,
  syncProgress,
  setIntentFocus,
  setErrors,
  setOrgNameValue,
  setSlugValue,
  setOrgSlugInputValue,
  setSlugEdited,
  setFormationStatus,
}: UseOnboardingFieldHandlersProps) {
  const handleIntentSelect = useCallback(
    (value: IntentFocus) => {
      setIntentFocus(value)
      setErrors((prev) => {
        if (!prev.intentFocus) return prev
        const next = { ...prev }
        delete next.intentFocus
        return next
      })
      saveDraft({ intentFocus: value })
      syncProgress()
    },
    [saveDraft, setErrors, setIntentFocus, syncProgress],
  )

  const handleOrgNameChange = useCallback(
    (value: string) => {
      setOrgNameValue(value)
      if (!slugEdited) {
        const nextSlug = slugify(value)
        setSlugValue(nextSlug)
        setOrgSlugInputValue(nextSlug)

        const input = formRef.current?.querySelector(
          'input[name="orgSlug"]',
        ) as HTMLInputElement | null
        if (input) input.value = nextSlug
      }
    },
    [formRef, setOrgNameValue, setOrgSlugInputValue, setSlugValue, slugEdited],
  )

  const handleOrgSlugChange = useCallback(
    (value: string) => {
      setSlugEdited(true)
      const normalized = slugify(value)
      setSlugValue(normalized)
      setOrgSlugInputValue(normalized)
      return normalized
    },
    [setOrgSlugInputValue, setSlugEdited, setSlugValue],
  )

  const handleFormationStatusSelect = useCallback(
    (value: FormationStatus) => {
      setFormationStatus(value)
      saveDraft({ formationStatus: value })
      syncProgress()
    },
    [saveDraft, setFormationStatus, syncProgress],
  )

  return {
    handleFormationStatusSelect,
    handleIntentSelect,
    handleOrgNameChange,
    handleOrgSlugChange,
  }
}
