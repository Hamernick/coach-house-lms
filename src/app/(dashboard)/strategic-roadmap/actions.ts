"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import { updateRoadmapSection, type RoadmapSection } from "@/lib/roadmap"
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

  revalidatePath("/strategic-roadmap")

  return { section }
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

  revalidatePath("/strategic-roadmap")

  return { ok: true }
}
