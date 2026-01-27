import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

export type NotificationTone = "warning" | "info" | "success"

export type NotificationPayload = {
  userId: string
  title: string
  description: string
  href?: string | null
  tone?: NotificationTone | null
  type?: string | null
  orgId?: string | null
  actorId?: string | null
  metadata?: Record<string, unknown> | null
}

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]

type NotificationInsertResult = { ok: true } | { error: string }

export async function createNotification(
  supabase: SupabaseClient<Database>,
  payload: NotificationPayload,
): Promise<NotificationInsertResult> {
  const title = payload.title.trim()
  const description = payload.description.trim()
  if (!title || !description) {
    return { error: "Notification requires a title and description." }
  }

  const insertPayload: NotificationInsert = {
    user_id: payload.userId,
    title,
    description,
    href: payload.href ?? null,
    tone: payload.tone ?? null,
    type: payload.type ?? null,
    org_id: payload.orgId ?? null,
    actor_id: payload.actorId ?? null,
    metadata: payload.metadata ?? null,
  }

  const { error } = await supabase.from("notifications").insert(insertPayload)
  if (error) return { error: error.message }
  return { ok: true }
}
