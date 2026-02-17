"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { NotificationTone } from "@/lib/notifications"

export type { NotificationTone } from "@/lib/notifications"

export type AppNotification = {
  id: string
  title: string
  description: string
  href: string | null
  tone: NotificationTone | null
  createdAt: string
  readAt: string | null
  archivedAt: string | null
}

type NotificationsListResult =
  | { ok: true; inbox: AppNotification[] }
  | { error: string }

type NotificationActionResult = { ok: true } | { error: string }

async function isAdminUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  if (error) return false
  return profile?.role === "admin"
}

function normalizeTone(value: unknown): NotificationTone | null {
  if (value === "warning" || value === "info" || value === "success")
    return value
  return null
}

function normalizeNotificationRow(row: {
  id: string
  title: string
  description: string
  href: string | null
  tone: string | null
  created_at: string
  read_at: string | null
  archived_at: string | null
}): AppNotification {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    href: row.href,
    tone: normalizeTone(row.tone),
    createdAt: row.created_at,
    readAt: row.read_at,
    archivedAt: row.archived_at,
  }
}

export async function listNotificationsAction(): Promise<NotificationsListResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const selectColumns =
    "id,title,description,href,tone,created_at,read_at,archived_at" as const

  const inboxResult = await supabase
    .from("notifications")
    .select(selectColumns)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<
      Array<{
        id: string
        title: string
        description: string
        href: string | null
        tone: string | null
        created_at: string
        read_at: string | null
        archived_at: string | null
      }>
    >()

  if (inboxResult.error) return { error: "Unable to load notifications." }

  return {
    ok: true,
    inbox: (inboxResult.data ?? []).map(normalizeNotificationRow),
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (updateError) return { error: "Unable to update notification." }
  return { ok: true }
}

export async function archiveNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (updateError) return { error: "Unable to archive notification." }
  return { ok: true }
}

export async function unarchiveNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ archived_at: null })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (updateError) return { error: "Unable to unarchive notification." }
  return { ok: true }
}

export async function archiveAllNotificationsAction(): Promise<NotificationActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { error: updateError } = await supabase
    .from("notifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("archived_at", null)

  if (updateError) return { error: "Unable to archive notifications." }
  return { ok: true }
}

export async function seedTestNotificationsAction(): Promise<NotificationActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error))
    return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const isAdmin = await isAdminUser(supabase, user.id)
  if (!isAdmin) return { error: "Forbidden." }

  const now = Date.now()

  const { error: insertError } = await supabase.from("notifications").insert([
    {
      user_id: user.id,
      title: "Strategic roadmap draft needs a pass",
      description: "Finish the Timeline section to unlock sharing.",
      href: "/roadmap",
      tone: "warning",
      created_at: new Date(now).toISOString(),
    },
    {
      user_id: user.id,
      title: "Checkpoint ready",
      description: "Schedule a check-in with Joel or Paula.",
      href: "/organization",
      tone: "info",
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: user.id,
      title: "Program checklist",
      description: "Add dates to the Youth Leadership Fellowship.",
      href: "/organization",
      tone: "success",
      created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
    },
  ])

  if (insertError) return { error: "Unable to create test notifications." }
  return { ok: true }
}
