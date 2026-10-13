import { type MutableRefObject } from "react"

import {
  collectDraftFlags,
  collectDraftValues,
  readDraftSnapshot,
  writeOnboardingDraft,
} from "@/components/onboarding/onboarding-dialog/draft"
import type {
  FormationStatus,
  IntentFocus,
  OnboardingDraft,
  RoleInterest,
} from "@/components/onboarding/onboarding-dialog/types"

export type SaveOnboardingDraftExtra = Partial<{
  step: number
  formationStatus: FormationStatus | ""
  intentFocus: IntentFocus | ""
  roleInterest: RoleInterest | ""
  slugEdited: boolean
  avatar: string | null
}>

type WriteOnboardingDraftSnapshotArgs = {
  formRef: MutableRefObject<HTMLFormElement | null>
  step: number
  formationStatus: FormationStatus | ""
  intentFocus: IntentFocus | ""
  roleInterest: RoleInterest | ""
  slugEdited: boolean
  avatar: string | null
  extra?: SaveOnboardingDraftExtra
}

export function writeOnboardingDraftSnapshot({
  formRef,
  step,
  formationStatus,
  intentFocus,
  roleInterest,
  slugEdited,
  avatar,
  extra,
}: WriteOnboardingDraftSnapshotArgs) {
  if (typeof window === "undefined" || !formRef.current) return

  const form = formRef.current
  const data = new FormData(form)
  const { values: previousValues, flags: previousFlags } = readDraftSnapshot()
  const nextValues = collectDraftValues(form, data, previousValues)
  const nextFlags = collectDraftFlags(form, previousFlags)
  if (extra?.intentFocus !== undefined) {
    nextValues.intentFocus = extra.intentFocus
  }
  if (extra?.roleInterest !== undefined) {
    nextValues.roleInterest = extra.roleInterest
  }

  const payload: OnboardingDraft = {
    step,
    formationStatus,
    intentFocus,
    roleInterest,
    slugEdited,
    avatar,
    values: nextValues,
    flags: nextFlags,
    ...(extra ?? {}),
  }

  writeOnboardingDraft(payload)
}
