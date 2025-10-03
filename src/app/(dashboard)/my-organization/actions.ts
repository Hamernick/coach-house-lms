"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import type { Database } from "@/lib/supabase"

type OrgProfilePayload = {
  name?: string | null
  entity?: string | null
  ein?: string | null
  incorporation?: string | null
  rep?: string | null
  phone?: string | null
  address?: string | null
  coverUrl?: string | null
  logoUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  people?: string | null
  programs?: string | null
  reports?: string | null
  toolkit?: string | null
  supporters?: string | null
  readinessScore?: string | number | null
}

export async function updateOrganizationProfileAction(payload: OrgProfilePayload) {
  const { supabase, session } = await requireServerSession("/my-organization")

  const userId = session.user.id

  // Load existing profile to merge
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("ein, profile")
    .eq("user_id", userId)
    .maybeSingle<{ ein: string | null; profile: Record<string, unknown> | null }>()

  if (orgErr) {
    return { error: orgErr.message }
  }

  const current = (orgRow?.profile ?? {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }

  for (const [k, v] of Object.entries(payload)) {
    // Store EIN in both the column and profile for now (column is canonical)
    if (k === "ein") {
      next[k] = v ?? null
    } else if (k === "readinessScore") {
      // Store as readiness_score in profile to match org_key convention
      const num = typeof v === 'number' ? v : (typeof v === 'string' && v.trim().length > 0 ? Number(v) : null)
      next["readiness_score"] = Number.isFinite(num as number) ? Number(num) : null
    } else {
      next[k] = typeof v === "string" && v.length === 0 ? null : v
    }
  }

  const insertPayload: Database["public"]["Tables"]["organizations"]["Insert"] = {
    user_id: userId,
    ein: typeof payload.ein === "string" ? payload.ein : orgRow?.ein ?? null,
    profile: next as unknown as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
  }

  const { error: upsertErr } = await supabase
    .from("organizations")
    .upsert(insertPayload, { onConflict: "user_id" })

  if (upsertErr) {
    return { error: upsertErr.message }
  }

  revalidatePath("/my-organization")
  return { ok: true }
}
