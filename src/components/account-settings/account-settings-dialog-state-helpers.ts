import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

type AccountSettingsSupabaseClient = SupabaseClient<Database, "public">

type SaveProfileSettingsArgs = {
  supabase: AccountSettingsSupabaseClient
  userId: string
  firstName: string
  lastName: string
  phone: string
  initialFirstName: string
  initialLastName: string
  initialPhone: string
}

type SaveProfileSettingsResult = {
  firstName: string
  lastName: string
  initialFirstName: string
  initialLastName: string
  initialPhone: string
}

type SaveCommunicationPreferencesArgs = {
  supabase: AccountSettingsSupabaseClient
  marketingOptIn: boolean
  newsletterOptIn: boolean
  acceleratorOverlayEnabled: boolean
  initialMarketingOptIn: boolean
  initialNewsletterOptIn: boolean
  initialAcceleratorOverlayEnabled: boolean
}

type SaveCommunicationPreferencesResult = {
  initialMarketingOptIn: boolean
  initialNewsletterOptIn: boolean
  initialAcceleratorOverlayEnabled: boolean
}

type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false
      sessionExpired: boolean
      message: string
    }

const DEFAULT_DELETE_ACCOUNT_ERROR = "Unable to delete account."
const SESSION_EXPIRED_DELETE_ACCOUNT_ERROR = "Session expired. Sign in again, then retry account deletion."
const SESSION_ERROR_FRAGMENTS = [
  "invalid refresh token",
  "refresh token not found",
  "auth session",
]

export function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message
  }
  return fallbackMessage
}

export function isMobileSettingsViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
}

export async function saveProfileSettings({
  supabase,
  userId,
  firstName,
  lastName,
  phone,
  initialFirstName,
  initialLastName,
  initialPhone,
}: SaveProfileSettingsArgs): Promise<SaveProfileSettingsResult> {
  const trimmedFirstName = firstName.trim()
  const trimmedLastName = lastName.trim()
  const initialFullName = [initialFirstName, initialLastName].filter(Boolean).join(" ")
  const nextFullName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(" ")

  let nextFirstName = firstName
  let nextLastName = lastName
  let nextInitialFirstName = initialFirstName
  let nextInitialLastName = initialLastName
  let nextInitialPhone = initialPhone

  if (initialFullName !== nextFullName) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: nextFullName || null }, { onConflict: "id" })
    if (profileError) {
      throw profileError
    }

    const { error: fullNameMetadataError } = await supabase.auth.updateUser({
      data: { full_name: nextFullName || null },
    })
    if (fullNameMetadataError) {
      throw fullNameMetadataError
    }

    nextInitialFirstName = trimmedFirstName
    nextInitialLastName = trimmedLastName
    nextFirstName = trimmedFirstName
    nextLastName = trimmedLastName
  }

  if (phone !== initialPhone) {
    const { error: phoneError } = await supabase.auth.updateUser({ data: { phone } })
    if (phoneError) {
      throw phoneError
    }
    nextInitialPhone = phone
  }

  return {
    firstName: nextFirstName,
    lastName: nextLastName,
    initialFirstName: nextInitialFirstName,
    initialLastName: nextInitialLastName,
    initialPhone: nextInitialPhone,
  }
}

export async function saveCommunicationPreferences({
  supabase,
  marketingOptIn,
  newsletterOptIn,
  acceleratorOverlayEnabled,
  initialMarketingOptIn,
  initialNewsletterOptIn,
  initialAcceleratorOverlayEnabled,
}: SaveCommunicationPreferencesArgs): Promise<SaveCommunicationPreferencesResult> {
  const metadata: Record<string, boolean> = {}
  if (marketingOptIn !== initialMarketingOptIn) {
    metadata.marketing_opt_in = marketingOptIn
  }
  if (newsletterOptIn !== initialNewsletterOptIn) {
    metadata.newsletter_opt_in = newsletterOptIn
  }
  if (acceleratorOverlayEnabled !== initialAcceleratorOverlayEnabled) {
    metadata.accelerator_overlay_enabled = acceleratorOverlayEnabled
  }

  if (Object.keys(metadata).length === 0) {
    return {
      initialMarketingOptIn,
      initialNewsletterOptIn,
      initialAcceleratorOverlayEnabled,
    }
  }

  const { error } = await supabase.auth.updateUser({ data: metadata })
  if (error) {
    throw error
  }

  return {
    initialMarketingOptIn: marketingOptIn,
    initialNewsletterOptIn: newsletterOptIn,
    initialAcceleratorOverlayEnabled: acceleratorOverlayEnabled,
  }
}

export async function requestDeleteAccount(): Promise<DeleteAccountResult> {
  try {
    const response = await fetch("/api/account/delete", { method: "DELETE" })
    if (response.ok) {
      return { ok: true }
    }

    const payload = await response.json().catch(() => ({}))
    const message =
      typeof payload?.error === "string" && payload.error.length > 0
        ? payload.error
        : DEFAULT_DELETE_ACCOUNT_ERROR
    const normalizedMessage = message.toLowerCase()
    const sessionExpired =
      response.status === 401 ||
      SESSION_ERROR_FRAGMENTS.some((fragment) => normalizedMessage.includes(fragment))

    if (sessionExpired) {
      return {
        ok: false,
        sessionExpired: true,
        message: SESSION_EXPIRED_DELETE_ACCOUNT_ERROR,
      }
    }

    return {
      ok: false,
      sessionExpired: false,
      message,
    }
  } catch {
    return {
      ok: false,
      sessionExpired: false,
      message: DEFAULT_DELETE_ACCOUNT_ERROR,
    }
  }
}
