/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import { geocodeAddress } from "@/lib/mapbox/geocode"
import type { Database } from "@/lib/supabase"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { sanitizeOrgProfileText, shouldStripOrgProfileHtml } from "@/lib/organization/profile-cleanup"

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
  headerUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  instagram?: string | null
  youtube?: string | null
  tiktok?: string | null
  newsletter?: string | null
  github?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  programs?: string | null
  reports?: string | null
  boilerplate?: string | null
  brandPrimary?: string | null
  brandColors?: string[] | null
  publicSlug?: string | null
  isPublic?: boolean | null
}

export async function updateOrganizationProfileAction(payload: OrgProfilePayload) {
  const { supabase, session } = await requireServerSession("/my-organization")

  const userId = session.user.id
  const allowPublicSharing = publicSharingEnabled

  // Load existing profile to merge
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("ein, profile, location_lat, location_lng, public_slug, is_public")
    .eq("user_id", userId)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      location_lat: number | null
      location_lng: number | null
      public_slug: string | null
      is_public: boolean | null
    }>()

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
      if (typeof v === "string") {
        if (shouldStripOrgProfileHtml(k)) {
          next[k] = sanitizeOrgProfileText(v)
        } else {
          next[k] = v.length === 0 ? null : v
        }
      } else if (Array.isArray(v)) {
        next[k] = v.filter((x) => typeof x === "string" && x.trim().length > 0)
      } else {
        next[k] = v
      }
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

  // Do not delete unknown keys; preserve previously stored profile fields for forward compatibility.

  // Normalize slug if provided, or derive from name when publishing
  const desiredSlug =
    typeof payload.publicSlug === "string" && payload.publicSlug.length > 0
      ? payload.publicSlug
      : allowPublicSharing && payload.isPublic
        ? String(payload.name ?? current["name"] ?? "")
        : ""
  const normalizedSlugRaw = desiredSlug ? slugify(desiredSlug) : undefined
  const normalizedSlug = normalizedSlugRaw && normalizedSlugRaw.length > 0 ? normalizedSlugRaw : undefined

  let locationLat = orgRow?.location_lat ?? null
  let locationLng = orgRow?.location_lng ?? null

  const addressForGeocode = typeof next.address === "string" ? next.address.replace(/\n+/g, ", ") : ""
  if (!addressForGeocode) {
    locationLat = null
    locationLng = null
  } else {
    const coords = await geocodeAddress(addressForGeocode)
    if (coords) {
      locationLat = coords.lat
      locationLng = coords.lng
    }
  }

  const insertPayload: any = {
    user_id: userId,
    ein: typeof payload.ein === "string" ? payload.ein : orgRow?.ein ?? null,
    public_slug: normalizedSlug ?? undefined,
    is_public: allowPublicSharing ? payload.isPublic ?? undefined : false,
    profile: next as unknown as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
    location_lat: locationLat,
    location_lng: locationLng,
  }

  const { error: upsertErr } = await supabase
    .from("organizations")
    .upsert(insertPayload, { onConflict: "user_id" })

  if (upsertErr) {
    return { error: upsertErr.message }
  }

  const previousSlug = typeof orgRow?.public_slug === "string" && orgRow.public_slug.length > 0 ? orgRow.public_slug : null
  const nextSlug = normalizedSlug ?? previousSlug
  const wasPublic = Boolean(orgRow?.is_public)
  const isPublic = allowPublicSharing ? (typeof payload.isPublic === "boolean" ? payload.isPublic : wasPublic) : false

  revalidateOrganizationViews({
    previousSlug,
    nextSlug,
    wasPublic,
    isPublic,
  })
  return { ok: true }
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return base.slice(0, 60).replace(/^-+|-+$/g, "")
}

function revalidateOrganizationViews({
  previousSlug,
  nextSlug,
  wasPublic,
  isPublic,
}: {
  previousSlug: string | null
  nextSlug: string | null
  wasPublic: boolean
  isPublic: boolean
}) {
  revalidatePath("/my-organization")

  if (isPublic || wasPublic) {
    revalidatePath("/community")
  }

  if (previousSlug) {
    revalidatePath(`/${previousSlug}`)
  }

  if (isPublic && nextSlug && nextSlug !== previousSlug) {
    revalidatePath(`/${nextSlug}`)
  }
}
 
