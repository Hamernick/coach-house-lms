import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"

import {
  applyDraftFlagsToForm,
  applyDraftValuesToForm,
  readOnboardingDraft,
} from "@/components/onboarding/onboarding-dialog/draft"
import { isFormationStatus, isIntentFocus, isRoleInterest, slugify } from "@/components/onboarding/onboarding-dialog/helpers"
import { resolveOnboardingSteps } from "@/components/onboarding/onboarding-dialog/constants"
import {
  isOnboardingAccountStepReady,
  type OnboardingAccountValues,
} from "@/components/onboarding/onboarding-dialog/state-helpers"
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
  setAccountStepReady: Dispatch<SetStateAction<boolean>>
  setAccountValues: Dispatch<SetStateAction<OnboardingAccountValues>>
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
  setAccountStepReady,
  setAccountValues,
  setOrgNameValue,
  setOrgSlugInputValue,
  setSlugValue,
  syncProgress,
}: UseOnboardingDraftStateArgs) {
  const applyDraftAccountState = useCallback(
    ({
      values,
      flags,
    }: {
      values: Record<string, unknown> | undefined
      flags: Record<string, unknown> | undefined
    }) => {
      if (!values && !flags) return

      const firstName = resolveDraftFieldValue("firstName", values?.firstName)
      const lastName = resolveDraftFieldValue("lastName", values?.lastName)
      const phone = resolveDraftFieldValue("phone", values?.phone)
      const publicEmail = resolveDraftFieldValue("publicEmail", values?.publicEmail)
      const title = resolveDraftFieldValue("title", values?.title)
      const linkedin = resolveDraftFieldValue("linkedin", values?.linkedin)
      const optInUpdates =
        typeof flags?.optInUpdates === "boolean" ? flags.optInUpdates : undefined
      const newsletterOptIn =
        typeof flags?.newsletterOptIn === "boolean"
          ? flags.newsletterOptIn
          : undefined

      setAccountValues((previous) => ({
        ...previous,
        firstName,
        lastName,
        phone,
        publicEmail,
        title,
        linkedin,
        optInUpdates: optInUpdates ?? previous.optInUpdates,
        newsletterOptIn: newsletterOptIn ?? previous.newsletterOptIn,
      }))
      setAccountStepReady(
        isOnboardingAccountStepReady({
          firstName,
          lastName,
        }),
      )
    },
    [resolveDraftFieldValue, setAccountStepReady, setAccountValues],
  )

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
      setSlugValue(draftOrgSlug)
      setOrgSlugInputValue(draftOrgSlug)
    }

    const draftIntentFocus = isIntentFocus(draft.intentFocus)
      ? draft.intentFocus
      : resolveDraftFieldValue("intentFocus", draft.values?.intentFocus)
    if (isIntentFocus(draftIntentFocus)) {
      setIntentFocus(draftIntentFocus)
    }

    const draftRoleInterest = resolveDraftFieldValue("roleInterest", draft.values?.roleInterest)
    if (isRoleInterest(draftRoleInterest)) {
      setRoleInterest(draftRoleInterest)
    }

    applyDraftFlagsToForm(form, draft.flags)
    applyDraftAccountState({ values: draft.values, flags: draft.flags })
  }, [
    applyDraftAccountState,
    formRef,
    resolveDraftFieldValue,
    setIntentFocus,
    setOrgNameValue,
    setOrgSlugInputValue,
    setRoleInterest,
    setSlugValue,
  ])

  useEffect(() => {
    if (!open) return
    if (typeof window === "undefined") return

    const draft = readOnboardingDraft()
    if (!draft) return

    if (typeof draft.step === "number") {
      const steps = resolveOnboardingSteps(
        isIntentFocus(draft.intentFocus) ? draft.intentFocus : "",
      )
      setStep(Math.max(0, Math.min(steps.length - 1, draft.step)))
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

    const intentFromValues = isIntentFocus(draft.intentFocus)
      ? draft.intentFocus
      : resolveDraftFieldValue("intentFocus", draft.values?.intentFocus)
    if (isIntentFocus(intentFromValues)) {
      setIntentFocus(intentFromValues)
    }

    const roleFromValues = resolveDraftFieldValue("roleInterest", draft.values?.roleInterest)
    if (isRoleInterest(roleFromValues)) {
      setRoleInterest(roleFromValues)
    }

    applyDraftFlagsToForm(form, draft.flags)
    applyDraftAccountState({ values: draft.values, flags: draft.flags })
    window.requestAnimationFrame(() => {
      syncProgress()
    })
  }, [
    applyDraftAccountState,
    formRef,
    open,
    resolveDraftFieldValue,
    setAccountStepReady,
    setAccountValues,
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
