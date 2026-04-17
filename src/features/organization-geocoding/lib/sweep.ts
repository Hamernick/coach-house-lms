import { timingSafeEqual } from "node:crypto"

import type { SupabaseClient } from "@supabase/supabase-js"

import { geocodeOrganizationLocation } from "@/lib/geocoding/geocode"
import {
  readOrganizationLocationType,
} from "@/lib/geocoding/organization-address"
import { buildOrganizationGeocodeQueries } from "@/lib/location/organization-location"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"

import type { OrganizationGeocodeSweepResult } from "../types"

type AdminClient = SupabaseClient<Database, "public">

type OrganizationGeocodeCandidateRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "user_id" | "profile" | "location_lat" | "location_lng" | "updated_at"
>

function resolveAdminClient(supabase?: AdminClient) {
  return supabase ?? createSupabaseAdminClient()
}

function resolveCronSecret() {
  return process.env.INTERNAL_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null
}

function safeCompareSecret(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function resolveRequestSecret(request: Request) {
  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim()
  }

  return request.headers.get("x-cron-secret")?.trim() || null
}

async function listOrganizationGeocodeCandidates(supabase: AdminClient, limit: number) {
  const { data, error } = await supabase
    .from("organizations")
    .select("user_id,profile,location_lat,location_lng,updated_at")
    .eq("is_public", true)
    .or("location_lat.is.null,location_lng.is.null")
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<OrganizationGeocodeCandidateRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

function readOrganizationName(profile: Record<string, unknown>) {
  const value = profile["name"]
  if (typeof value !== "string") return "Organization"
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "Organization"
}

export function authorizeOrganizationGeocodingCronRequest(request: Request) {
  const expectedSecret = resolveCronSecret()
  if (!expectedSecret) {
    return { ok: false as const, status: 500, error: "Organization geocoding cron secret is not configured." }
  }

  const providedSecret = resolveRequestSecret(request)
  if (!providedSecret || !safeCompareSecret(providedSecret, expectedSecret)) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }

  return { ok: true as const }
}

export async function runOrganizationGeocodeSweep({
  limit = 25,
  supabase,
}: {
  limit?: number
  supabase?: AdminClient
} = {}): Promise<OrganizationGeocodeSweepResult> {
  const admin = resolveAdminClient(supabase)
  const candidates = await listOrganizationGeocodeCandidates(admin, limit)

  let updated = 0
  let failed = 0
  let skippedMissingAddress = 0
  let skippedOnlineOnly = 0
  const updatedOrganizations: Array<{ orgId: string; name: string }> = []

  for (const row of candidates) {
    const profile = (row.profile ?? {}) as Record<string, unknown>
    if (readOrganizationLocationType(profile) === "online") {
      skippedOnlineOnly += 1
      continue
    }

    const geocodeQueries = buildOrganizationGeocodeQueries({
      street: profile["address_street"],
      city: profile["address_city"],
      state: profile["address_state"],
      postal: profile["address_postal"],
      country: profile["address_country"],
      fallbackAddress: profile["address"],
    })
    if (geocodeQueries.length === 0) {
      skippedMissingAddress += 1
      continue
    }

    const coords = await geocodeOrganizationLocation({
      street: profile["address_street"],
      city: profile["address_city"],
      state: profile["address_state"],
      postal: profile["address_postal"],
      country: profile["address_country"],
      fallbackAddress: profile["address"],
    })
    if (!coords) {
      failed += 1
      continue
    }

    const { error } = await admin
      .from("organizations")
      .update({
        location_lat: coords.lat,
        location_lng: coords.lng,
      })
      .eq("user_id", row.user_id)

    if (error) {
      failed += 1
      continue
    }

    updated += 1
    updatedOrganizations.push({
      orgId: row.user_id,
      name: readOrganizationName(profile),
    })
  }

  return {
    scanned: candidates.length,
    updated,
    failed,
    skippedMissingAddress,
    skippedOnlineOnly,
    updatedOrganizations,
  }
}
