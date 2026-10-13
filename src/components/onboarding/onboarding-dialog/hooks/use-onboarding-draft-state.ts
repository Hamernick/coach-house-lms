import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"

import {
  applyDraftFlagsToForm,
  applyDraftValuesToForm,
  readOnboardingDraft,
} from "@/components/onboarding/onboarding-dialog/draft"
import { isFormationStatus, isIntentFocus, isRoleInterest, slugify } from "@/components/onboarding/onboarding-dialog/helpers"
import { STEPS } from "@/components/onboarding/onboarding-dialog/constants"
import type {
  FormationStatus,
  IntentFocus,
  RoleInterest,
} from "@/components/onboarding/onboarding-dialog/types"

type UseOnboardingDraftStateArgs = {
  open: boolean
  step: number
  formRef: RefObject<HTMLFormElement | null>
  resolveDraftFieldValue: (key: string, draftValue: unknown) => string
  setStep: Dispatch<SetStateAction<number>>
  setFormationStatus: Dispatch<SetStateAction<FormationStatus | "">>
  setIntentFocus: Dispatch<SetStateAction<IntentFocus | "">>
  setRoleInterest: Dispatch<SetStateAction<RoleInterest | "">>
  setSlugEdited: Dispatch<SetStateAction<boolean>>
  setAvatarPreview: Dispatch<SetStateAction<string | null>>
  setOrgNameValue: Dispatch<SetStateAction<string>>
  setOrgSlugInputValue: Dispatch<SetStateAction<string>>
  setSlugValue: Dispatch<SetStateAction<string>>
  syncProgress: () => void
}

export function useOnboardingDraftState({
  open,
  step,
  formRef,
  resolveDraftFieldValue,
  setStep,
  setFormationStatus,
  setIntentFocus,
  setRoleInterest,
  setSlugEdited,
  setAvatarPreview,
  setOrgNameValue,
  setOrgSlugInputValue,
  setSlugValue,
  syncProgress,
}: UseOnboardingDraftStateArgs) {
  const rehydrateVisibleDraftFields = useCallback(() => {
    if (typeof window === "undefined" || !formRef.current) return

    const draft = readOnboardingDraft()
    if (!draft) return

    const form = formRef.current
    applyDraftValuesToForm(form, draft.values, resolveDraftFieldValue)

    const draftOrgName = resolveDraftFieldValue("orgName", draft.values?.orgName)
    if (draftOrgName) {
      setOrgNameValue(draftOrgName)
    }

    const draftOrgSlug = slugify(resolveDraftFieldValue("orgSlug", draft.values?.orgSlug))
    if (draftOrgSlug) {
      setOrgSlugInputValue(draftOrgSlug)
    }

    const draftIntentFocus = resolveDraftFieldValue("intentFocus", draft.values?.intentFocus)
    if (isIntentFocus(draftIntentFocus)) {
      setIntentFocus(draftIntentFocus)
    }

    const draftRoleInterest = resolveDraftFieldValue("roleInterest", draft.values?.roleInterest)
    if (isRoleInterest(draftRoleInterest)) {
      setRoleInterest(draftRoleInterest)
    }

    applyDraftFlagsToForm(form, draft.flags)
  }, [formRef, resolveDraftFieldValue, setIntentFocus, setOrgNameValue, setOrgSlugInputValue, setRoleInterest])

  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return

    const draft = readOnboardingDraft()
    if (!draft) return

    if (typeof draft.step === "number") {
      setStep(Math.max(0, Math.min(STEPS.length - 1, draft.step)))
    }
    if (isFormationStatus(draft.formationStatus)) {
      setFormationStatus(draft.formationStatus)
    }
    if (isIntentFocus(draft.intentFocus)) {
      setIntentFocus(draft.intentFocus)
    }
    if (isRoleInterest(draft.roleInterest)) {
      setRoleInterest(draft.roleInterest)
    }
    setSlugEdited(Boolean(draft.slugEdited))
    if (typeof draft.avatar === "string" && draft.avatar.trim().length > 0) {
      setAvatarPreview(draft.avatar)
    }

    const form = formRef.current
    if (!form) return

    applyDraftValuesToForm(form, draft.values, resolveDraftFieldValue)

    const orgName = resolveDraftFieldValue("orgName", draft.values?.orgName)
    if (orgName) {
      setOrgNameValue(orgName)
    }

    const slug = resolveDraftFieldValue("orgSlug", draft.values?.orgSlug)
    if (slug) {
      const normalizedSlug = slugify(slug)
      setSlugValue(normalizedSlug)
      setOrgSlugInputValue(normalizedSlug)
    }

    const intentFromValues = resolveDraftFieldValue("intentFocus", draft.values?.intentFocus)
    if (isIntentFocus(intentFromValues)) {
      setIntentFocus(intentFromValues)
    }

    const roleFromValues = resolveDraftFieldValue("roleInterest", draft.values?.roleInterest)
    if (isRoleInterest(roleFromValues)) {
      setRoleInterest(roleFromValues)
    }

    applyDraftFlagsToForm(form, draft.flags)
    window.requestAnimationFrame(() => {
      syncProgress()
    })
  }, [
    formRef,
    open,
    resolveDraftFieldValue,
    setAvatarPreview,
    setFormationStatus,
    setIntentFocus,
    setOrgNameValue,
    setOrgSlugInputValue,
    setRoleInterest,
    setSlugEdited,
    setSlugValue,
    setStep,
    syncProgress,
  ])

  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return

    const frame = window.requestAnimationFrame(() => {
      rehydrateVisibleDraftFields()
      syncProgress()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [open, step, rehydrateVisibleDraftFields, syncProgress])

}
