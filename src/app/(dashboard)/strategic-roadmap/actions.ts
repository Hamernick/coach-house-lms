"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import { removeRoadmapSection, updateRoadmapSection, type RoadmapSection } from "@/lib/roadmap"
import { publicSharingEnabled } from "@/lib/feature-flags"

type SaveInput = {
  sectionId?: string
  title?: string
  subtitle?: string
  content?: string
  isPublic?: boolean
  layout?: "square" | "vertical" | "wide"
  ctaLabel?: string
  ctaUrl?: string
}

type SaveResult = { section: RoadmapSection } | { error: string }
type DeleteResult = { ok: true } | { error: string }

export async function saveRoadmapSectionAction({
  sectionId,
  title,
  subtitle,
  content,
  isPublic,
  layout,
  ctaLabel,
  ctaUrl,
}: SaveInput): Promise<SaveResult> {
  const allowPublicSharing = publicSharingEnabled
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { error: userError.message }
  }

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Json | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const { nextProfile, section } = updateRoadmapSection(currentProfile, sectionId ?? null, {
    title,
    subtitle,
    content,
    isPublic: allowPublicSharing ? isPublic : false,
    layout,
    ctaLabel,
    ctaUrl,
  })

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({
      user_id: user.id,
      profile: nextProfile as Json,
    })

  if (upsertError) {
    return { error: upsertError.message }
  }

  revalidatePath("/my-organization")

  return { section }
}

export async function deleteRoadmapSectionAction(sectionId: string | null | undefined): Promise<DeleteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { error: userError.message }
  }

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Json | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const { nextProfile, removed, error } = removeRoadmapSection(currentProfile, sectionId)

  if (error) {
    return { error }
  }

  if (!removed) {
    return { error: "Unable to delete section." }
  }

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({
      user_id: user.id,
      profile: nextProfile as Json,
    })

  if (upsertError) {
    return { error: upsertError.message }
  }

  revalidatePath("/my-organization")

  return { ok: true }
}

type ToggleResult = { ok: true } | { error: string }

export async function setRoadmapPublicAction(nextPublic: boolean): Promise<ToggleResult> {
  if (!publicSharingEnabled) {
    return { error: "Public sharing is disabled until launch." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { error: userError.message }
  }

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("organizations")
    .upsert({
      user_id: user.id,
      is_public_roadmap: nextPublic,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/my-organization")

  return { ok: true }
}

type HeroResult = { ok: true } | { error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

export async function setRoadmapHeroImageAction(heroUrl: string | null): Promise<HeroResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { error: userError.message }
  }

  if (!user) {
    return { error: "Unauthorized" }
  }

  const nextHero = typeof heroUrl === "string" && heroUrl.trim().length > 0 ? heroUrl.trim() : null

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public_roadmap")
    .eq("user_id", user.id)
    .maybeSingle<{ profile: Json | null; public_slug: string | null; is_public_roadmap: boolean | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const nextProfile = isRecord(currentProfile) ? { ...currentProfile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}
  roadmapRecord.heroUrl = nextHero
  nextProfile.roadmap = roadmapRecord

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({ user_id: user.id, profile: nextProfile as Json }, { onConflict: "user_id" })

  if (upsertError) {
    return { error: upsertError.message }
  }

  revalidatePath("/my-organization")
  if (orgRow?.public_slug && orgRow?.is_public_roadmap) {
    revalidatePath(`/${orgRow.public_slug}/roadmap`)
  }

  return { ok: true }
}
