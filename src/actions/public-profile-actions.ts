"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  PUBLIC_HANDLE_MAX_LENGTH,
  PUBLIC_HANDLE_MIN_LENGTH,
  validatePublicHandle,
} from "@/features/public-profiles"
import type {
  PublicHandleResult,
  PublicPersonProfileInput,
  PublicPersonProfileSaveResult,
} from "@/features/public-profiles"

const nullableHttpUrl = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://")
  )
  .nullable()

const publicPersonProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  headline: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(500).nullable(),
  locationLabel: z.string().trim().max(120).nullable(),
  websiteUrl: nullableHttpUrl,
  avatarUrl: nullableHttpUrl,
  isPublic: z.boolean(),
  showOrganizations: z.boolean(),
  showProgramActivity: z.boolean(),
  showSavedLocations: z.boolean(),
})

function readRpcRecord(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

export async function claimPersonPublicHandleAction(
  input: string
): Promise<PublicHandleResult> {
  const validation = validatePublicHandle(input)
  if (!validation.valid) {
    return {
      ok: false,
      code: validation.code,
      error:
        validation.code === "reserved"
          ? "That username is reserved."
          : `Use ${PUBLIC_HANDLE_MIN_LENGTH}-${PUBLIC_HANDLE_MAX_LENGTH} lowercase letters, numbers, or single hyphens.`,
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("claim_person_public_handle", {
    p_handle: validation.handle,
  })

  if (error) {
    console.error("Unable to claim public handle.", error)
    return { ok: false, code: "taken", error: "Unable to save that username." }
  }

  const result = readRpcRecord(data)
  if (result?.ok === true && result.code === "claimed") {
    revalidateTag("public-profiles", "max")
    return { ok: true, code: "claimed", handle: validation.handle }
  }

  const code =
    result?.code === "reserved" || result?.code === "invalid"
      ? result.code
      : "taken"
  return {
    ok: false,
    code,
    error:
      code === "reserved"
        ? "That username is reserved."
        : code === "invalid"
          ? "Enter a valid username."
          : "That username is already taken.",
  }
}

export async function savePublicPersonProfileAction(
  input: PublicPersonProfileInput
): Promise<PublicPersonProfileSaveResult> {
  const parsed = publicPersonProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid",
      error: "Check the public profile fields.",
    }
  }

  const value = parsed.data
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("save_public_person_profile", {
    p_display_name: value.displayName,
    p_headline: value.headline,
    p_bio: value.bio,
    p_location_label: value.locationLabel,
    p_website_url: value.websiteUrl,
    p_avatar_url: value.avatarUrl,
    p_is_public: value.isPublic,
    p_show_organizations: value.showOrganizations,
    p_show_program_activity: value.showProgramActivity,
    p_show_saved_locations: value.showSavedLocations,
  })

  if (error) {
    console.error("Unable to save public person profile.", error)
    return {
      ok: false,
      code: "invalid",
      error: "Unable to save the public profile.",
    }
  }

  const result = readRpcRecord(data)
  if (result?.ok === true && result.code === "saved") {
    revalidateTag("public-profiles", "max")
    return { ok: true, code: "saved" }
  }

  if (result?.code === "handle_required") {
    return {
      ok: false,
      code: "handle_required",
      error: "Choose a username before publishing your profile.",
    }
  }

  return {
    ok: false,
    code: "invalid",
    error: "Unable to save the public profile.",
  }
}
