"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import type { Database } from "@/lib/supabase"

type OrgProfilePayload = {
  name?: string | null
  description?: string | null
  tagline?: string | null
  ein?: string | null
  rep?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  logoUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  programs?: string | null
  reports?: string | null
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
    } else {
      next[k] = typeof v === "string" && v.length === 0 ? null : v
    }
  }

  const addressMapping: Array<[keyof OrgProfilePayload, string]> = [
    ["addressStreet", "address_street"],
    ["addressCity", "address_city"],
    ["addressState", "address_state"],
    ["addressPostal", "address_postal"],
    ["addressCountry", "address_country"],
  ]

  for (const [camel, snake] of addressMapping) {
    const raw = payload[camel]
    let normalized: string | null
    if (typeof raw === "string") {
      const trimmed = raw.trim()
      normalized = trimmed.length > 0 ? trimmed : null
    } else if (raw === null) {
      normalized = null
    } else {
      const existing = next[snake] as string | null | undefined
      normalized = typeof existing === "string" && existing.trim().length > 0 ? existing.trim() : null
    }
    next[snake] = normalized
    delete next[camel as string]
  }

  const street = typeof next["address_street"] === "string" ? (next["address_street"] as string).trim() : ""
  const city = typeof next["address_city"] === "string" ? (next["address_city"] as string).trim() : ""
  const state = typeof next["address_state"] === "string" ? (next["address_state"] as string).trim() : ""
  const postal = typeof next["address_postal"] === "string" ? (next["address_postal"] as string).trim() : ""
  const country = typeof next["address_country"] === "string" ? (next["address_country"] as string).trim() : ""

  const addressLines: string[] = []
  if (street) addressLines.push(street)
  const locality = [city, state, postal].filter(Boolean).join(", ")
  if (locality) addressLines.push(locality)
  if (country) addressLines.push(country)

  if (addressLines.length > 0) {
    next.address = addressLines.join("\n")
  } else {
    const fallbackAddress =
      typeof payload.address === "string" && payload.address.trim().length > 0
        ? payload.address.trim()
        : (typeof current["address"] === "string" && current["address"]?.trim()?.length
            ? (current["address"] as string).trim()
            : null)
    next.address = fallbackAddress
  }

  delete next.entity
  delete next.incorporation
  delete next.readiness_score
  delete next.toolkit
  delete next.supporters

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
