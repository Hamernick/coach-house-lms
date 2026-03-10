"use client"

import * as React from "react"

import {
  resolveDraftFieldValue as resolveDraftFieldValueFromDefaults,
  resolveOnboardingDefaultValues,
} from "../state-helpers"
import type { OnboardingDialogProps } from "../types"

type UseOnboardingDefaultsParams = Pick<
  OnboardingDialogProps,
  | "defaultEmail"
  | "defaultOrgName"
  | "defaultOrgSlug"
  | "defaultFormationStatus"
  | "defaultIntentFocus"
  | "defaultRoleInterest"
  | "defaultFirstName"
  | "defaultLastName"
  | "defaultPhone"
  | "defaultPublicEmail"
  | "defaultTitle"
  | "defaultLinkedin"
  | "defaultAvatarUrl"
  | "defaultOptInUpdates"
  | "defaultNewsletterOptIn"
>

export function useOnboardingDefaults({
  defaultEmail,
  defaultOrgName,
  defaultOrgSlug,
  defaultFormationStatus,
  defaultIntentFocus,
  defaultRoleInterest,
  defaultFirstName,
  defaultLastName,
  defaultPhone,
  defaultPublicEmail,
  defaultTitle,
  defaultLinkedin,
  defaultAvatarUrl,
  defaultOptInUpdates,
  defaultNewsletterOptIn,
}: UseOnboardingDefaultsParams) {
  const defaults = React.useMemo(
    () =>
      resolveOnboardingDefaultValues({
        defaultEmail,
        defaultOrgName,
        defaultOrgSlug,
        defaultFormationStatus,
        defaultIntentFocus,
        defaultRoleInterest,
        defaultFirstName,
        defaultLastName,
        defaultPhone,
        defaultPublicEmail,
        defaultTitle,
        defaultLinkedin,
        defaultAvatarUrl,
        defaultOptInUpdates,
        defaultNewsletterOptIn,
      }),
    [
      defaultAvatarUrl,
      defaultEmail,
      defaultFirstName,
      defaultFormationStatus,
      defaultIntentFocus,
      defaultLastName,
      defaultLinkedin,
      defaultNewsletterOptIn,
      defaultOptInUpdates,
      defaultOrgName,
      defaultOrgSlug,
      defaultPhone,
      defaultPublicEmail,
      defaultRoleInterest,
      defaultTitle,
    ],
  )

  const {
    initialOrgName,
    initialOrgSlug,
    initialFormationStatus,
    initialIntentFocus,
    initialRoleInterest,
    initialFirstName,
    initialLastName,
    initialPhone,
    initialPublicEmail,
    initialTitle,
    initialLinkedin,
    initialAvatarUrl,
    initialOptInUpdates,
    initialNewsletterOptIn,
  } = defaults

  const persistedFieldDefaults = React.useMemo<Record<string, string>>(
    () => ({
      intentFocus: initialIntentFocus || "",
      roleInterest: initialRoleInterest || "",
      orgName: initialOrgName,
      orgSlug: initialOrgSlug,
      firstName: initialFirstName,
      lastName: initialLastName,
      phone: initialPhone,
      publicEmail: initialPublicEmail,
      title: initialTitle,
      linkedin: initialLinkedin,
    }),
    [
      initialIntentFocus,
      initialRoleInterest,
      initialOrgName,
      initialOrgSlug,
      initialFirstName,
      initialLastName,
      initialPhone,
      initialPublicEmail,
      initialTitle,
      initialLinkedin,
    ],
  )

  const resolveDraftFieldValue = React.useCallback(
    (key: string, draftValue: unknown) => {
      return resolveDraftFieldValueFromDefaults(persistedFieldDefaults, key, draftValue)
    },
    [persistedFieldDefaults],
  )

  return {
    ...defaults,
    resolveDraftFieldValue,
  }
}
