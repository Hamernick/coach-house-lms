import { revalidatePath } from "next/cache"

import type { Database } from "@/lib/supabase"
import { stripHtml } from "@/lib/markdown/convert"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export function isRlsError(error: { message?: string | null; code?: string | number | null } | null | undefined) {
  if (!error) return false
  const message = String(error.message ?? "").toLowerCase()
  const code = error.code != null ? String(error.code) : ""
  return message.includes("row-level security") || code === "42501"
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function randomId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

export async function ensureUniqueClassSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  baseSlug: string,
  currentId?: string,
) {
  let attempt = 0
  let candidate = baseSlug
  while (attempt < 5) {
    const { data } = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>()
    if (!data || (currentId && data.id === currentId)) {
      return candidate
    }
    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
  return `${baseSlug}-${randomId().slice(0, 6)}`
}

export function extractSummary(subtitle: string, body: string) {
  const trimmedSubtitle = subtitle.trim()
  if (trimmedSubtitle.length > 0) {
    return trimmedSubtitle
  }
  const plain = stripHtml(body)
  if (plain.length === 0) {
    return null
  }
  const summary = plain.slice(0, 240).trim()
  return summary.length > 0 ? summary : null
}

export const SHARED_REVALIDATE_TARGETS: Array<Parameters<typeof revalidatePath>> = [
  ["/admin/academy"],
  ["/admin/classes"],
  ["/dashboard", "layout"],
  ["/dashboard"],
  ["/training"],
]

export async function safeDeleteClass(
  classId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  admin = createSupabaseAdminClient(),
) {
  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("id", classId)
  if (error && isRlsError(error)) {
    await admin
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .delete()
      .eq("id", classId)
  }
}
