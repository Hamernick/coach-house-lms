"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"

export type TutorialKey =
  | "platform"
  | "dashboard"
  | "my-organization"
  | "roadmap"
  | "documents"
  | "billing"
  | "accelerator"
  | "people"
  | "marketplace"

const ALLOWED_TUTORIALS: TutorialKey[] = [
  "platform",
  "dashboard",
  "my-organization",
  "roadmap",
  "documents",
  "billing",
  "accelerator",
  "people",
  "marketplace",
]

type TutorialActionResult = { ok: true } | { error: string }

function isTutorialKey(value: string): value is TutorialKey {
  return (ALLOWED_TUTORIALS as string[]).includes(value)
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const record = value as Record<string, unknown>
  const next: Record<string, string> = {}
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === "string") {
      next[key] = entry
    }
  }
  return next
}

function uniquePush(items: string[], value: string) {
  if (items.includes(value)) return items
  return [...items, value]
}

export async function markTutorialCompletedAction(tutorial: string): Promise<TutorialActionResult> {
  if (!isTutorialKey(tutorial)) return { error: "Invalid tutorial key." }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const completed = normalizeStringArray(meta.tutorials_completed)
  const dismissed = normalizeStringArray(meta.tutorials_dismissed)
  const completedAt = normalizeStringRecord(meta.tutorials_completed_at)

  const now = new Date().toISOString()

  const nextCompleted = uniquePush(completed, tutorial)
  const nextDismissed = dismissed.filter((entry) => entry !== tutorial)
  const nextCompletedAt = { ...completedAt, [tutorial]: now }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      tutorials_completed: nextCompleted,
      tutorials_dismissed: nextDismissed,
      tutorials_completed_at: nextCompletedAt,
    },
  })

  if (updateError) return { error: "Unable to update tutorial state." }
  return { ok: true }
}

export async function dismissTutorialAction(tutorial: string): Promise<TutorialActionResult> {
  if (!isTutorialKey(tutorial)) return { error: "Invalid tutorial key." }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const dismissed = normalizeStringArray(meta.tutorials_dismissed)
  const dismissedAt = normalizeStringRecord(meta.tutorials_dismissed_at)

  const now = new Date().toISOString()

  const nextDismissed = uniquePush(dismissed, tutorial)
  const nextDismissedAt = { ...dismissedAt, [tutorial]: now }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      tutorials_dismissed: nextDismissed,
      tutorials_dismissed_at: nextDismissedAt,
    },
  })

  if (updateError) return { error: "Unable to update tutorial state." }
  return { ok: true }
}

export async function resetTutorialAction(tutorial: string): Promise<TutorialActionResult> {
  if (!isTutorialKey(tutorial)) return { error: "Invalid tutorial key." }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester: resolveTesterMetadata(user.user_metadata ?? null),
  })
  if (!audience.isAdmin && !audience.isTester) return { error: "Forbidden." }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const completed = normalizeStringArray(meta.tutorials_completed).filter((entry) => entry !== tutorial)
  const dismissed = normalizeStringArray(meta.tutorials_dismissed).filter((entry) => entry !== tutorial)
  const completedAt = normalizeStringRecord(meta.tutorials_completed_at)
  const dismissedAt = normalizeStringRecord(meta.tutorials_dismissed_at)

  const nextCompletedAt = { ...completedAt }
  delete nextCompletedAt[tutorial]
  const nextDismissedAt = { ...dismissedAt }
  delete nextDismissedAt[tutorial]

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      tutorials_completed: completed,
      tutorials_dismissed: dismissed,
      tutorials_completed_at: nextCompletedAt,
      tutorials_dismissed_at: nextDismissedAt,
    },
  })

  if (updateError) return { error: "Unable to update tutorial state." }
  return { ok: true }
}

export async function resetAllTutorialsAction(): Promise<TutorialActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester: resolveTesterMetadata(user.user_metadata ?? null),
  })
  if (!audience.isAdmin && !audience.isTester) return { error: "Forbidden." }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      tutorials_completed: [],
      tutorials_dismissed: [],
      tutorials_completed_at: {},
      tutorials_dismissed_at: {},
    },
  })

  if (updateError) return { error: "Unable to update tutorial state." }
  return { ok: true }
}
