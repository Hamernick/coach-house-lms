import { STEPS } from "./constants"
import { isFormationStatus, isIntentFocus, isRoleInterest, slugify } from "./helpers"
import type {
  FormationStatus,
  IntentFocus,
  OnboardingSlugStatus,
  RoleInterest,
} from "./types"

type ResolveOnboardingDefaultsArgs = {
  defaultEmail?: string | null
  defaultOrgName?: string | null
  defaultOrgSlug?: string | null
  defaultFormationStatus?: FormationStatus | null
  defaultIntentFocus?: IntentFocus | null
  defaultRoleInterest?: RoleInterest | null
  defaultFirstName?: string | null
  defaultLastName?: string | null
  defaultPhone?: string | null
  defaultPublicEmail?: string | null
  defaultTitle?: string | null
  defaultLinkedin?: string | null
  defaultAvatarUrl?: string | null
  defaultOptInUpdates?: boolean | null
  defaultNewsletterOptIn?: boolean | null
}

export type OnboardingDefaultValues = {
  initialOrgName: string
  initialOrgSlug: string
  initialFormationStatus: FormationStatus | ""
  initialIntentFocus: IntentFocus | ""
  initialRoleInterest: RoleInterest | ""
  initialFirstName: string
  initialLastName: string
  initialPhone: string
  initialPublicEmail: string
  initialTitle: string
  initialLinkedin: string
  initialAvatarUrl: string | null
  initialOptInUpdates: boolean
  initialNewsletterOptIn: boolean
}

export function resolveOnboardingDefaultValues({
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
}: ResolveOnboardingDefaultsArgs): OnboardingDefaultValues {
  const initialOrgName = (defaultOrgName ?? "").trim()
  const initialOrgSlug = slugify((defaultOrgSlug ?? "").trim() || initialOrgName)

  return {
    initialOrgName,
    initialOrgSlug,
    initialFormationStatus: isFormationStatus(defaultFormationStatus)
      ? defaultFormationStatus
      : "",
    initialIntentFocus: isIntentFocus(defaultIntentFocus) ? defaultIntentFocus : "build",
    initialRoleInterest: isRoleInterest(defaultRoleInterest) ? defaultRoleInterest : "",
    initialFirstName: (defaultFirstName ?? "").trim(),
    initialLastName: (defaultLastName ?? "").trim(),
    initialPhone: (defaultPhone ?? "").trim(),
    initialPublicEmail: (defaultPublicEmail ?? defaultEmail ?? "").trim(),
    initialTitle: (defaultTitle ?? "").trim(),
    initialLinkedin: (defaultLinkedin ?? "").trim(),
    initialAvatarUrl: (defaultAvatarUrl ?? "").trim() || null,
    initialOptInUpdates: defaultOptInUpdates ?? true,
    initialNewsletterOptIn: defaultNewsletterOptIn ?? true,
  }
}

export function resolveDraftFieldValue(
  defaults: Record<string, string>,
  key: string,
  draftValue: unknown,
) {
  const value = typeof draftValue === "string" ? draftValue : ""
  if (value.trim().length > 0) return value
  return defaults[key] ?? value
}

export function validateOnboardingStep({
  stepIndex,
  form,
  formationStatus,
  slugStatus,
  slugHint,
}: {
  stepIndex: number
  form: FormData
  formationStatus: FormationStatus | ""
  slugStatus: OnboardingSlugStatus
  slugHint: string | null
}) {
  const nextErrors: Record<string, string> = {}
  const active = STEPS[stepIndex]?.id

  if (active === "org") {
    const orgName = String(form.get("orgName") ?? "").trim()
    const orgSlug = slugify(String(form.get("orgSlug") ?? "").trim())
    if (!orgName) nextErrors.orgName = "Organization name is required"
    if (!orgSlug) nextErrors.orgSlug = "Organization URL is required"
    if (!formationStatus) {
      nextErrors.formationStatus = "Choose your formation status"
    }
    if (slugStatus !== "available") {
      nextErrors.orgSlug = slugHint ?? "Choose an available URL"
    }
  }

  if (active === "account") {
    const firstName = String(form.get("firstName") ?? "").trim()
    const lastName = String(form.get("lastName") ?? "").trim()
    if (!firstName) nextErrors.firstName = "First name is required"
    if (!lastName) nextErrors.lastName = "Last name is required"
  }

  return nextErrors
}
