"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import {
  ROADMAP_SECTION_LIMIT,
  removeRoadmapSection,
  resolveRoadmapSections,
  updateRoadmapSection,
  type RoadmapSection,
} from "@/lib/roadmap"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { ORG_MEDIA_BUCKET, resolveOrgMediaCleanupPath } from "@/lib/storage/org-media"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"

type SaveInput = {
  sectionId?: string
  title?: string
  subtitle?: string
  content?: string
  imageUrl?: string | null
  isPublic?: boolean
  layout?: "square" | "vertical" | "wide"
  status?: "not_started" | "in_progress" | "complete"
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
  imageUrl,
  isPublic,
  layout,
  status,
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

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) return { error: "Forbidden" }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile, public_slug")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Json | null; public_slug: string | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const existingSections = resolveRoadmapSections(currentProfile)
  const normalizedSectionId = typeof sectionId === "string" ? sectionId.trim() : ""
  const previousSection = normalizedSectionId
    ? existingSections.find((section) => section.id === normalizedSectionId) ?? null
    : null

  if (!previousSection && existingSections.length >= ROADMAP_SECTION_LIMIT) {
    return { error: `Roadmaps support up to ${ROADMAP_SECTION_LIMIT} sections.` }
  }
  const isNewSection = !previousSection
  const { nextProfile, section } = updateRoadmapSection(currentProfile, sectionId ?? null, {
    title,
    subtitle,
    content,
    imageUrl,
    isPublic: allowPublicSharing ? isPublic : false,
    layout,
    status,
    ctaLabel,
    ctaUrl,
  })

  const cleanupPath = resolveOrgMediaCleanupPath({
    previousUrl: previousSection?.imageUrl ?? null,
    nextUrl: section.imageUrl ?? null,
    userId: orgId,
  })

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({
      user_id: orgId,
      profile: nextProfile as Json,
    })

  if (upsertError) {
    return { error: upsertError.message }
  }

  if (cleanupPath) {
    await supabase.storage.from(ORG_MEDIA_BUCKET).remove([cleanupPath])
  }

  revalidatePath("/roadmap")
  if (orgRow?.public_slug) {
    revalidatePath(`/${orgRow.public_slug}/roadmap`)
  }

  if (isNewSection) {
    const notifyResult = await createNotification(supabase, {
      userId: user.id,
      title: "Roadmap section added",
      description: section.title ? `New section: ${section.title}.` : "A new roadmap section was added.",
      href: "/my-organization",
      tone: "success",
      type: "roadmap_section_added",
      actorId: user.id,
      metadata: { sectionId: section.id },
    })
    if ("error" in notifyResult) {
      console.error("Failed to create roadmap notification", notifyResult.error)
    }
  }

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

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) return { error: "Forbidden" }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile, public_slug")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Json | null; public_slug: string | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const targetId = typeof sectionId === "string" ? sectionId.trim() : ""
  const previousSection = targetId ? resolveRoadmapSections(currentProfile).find((section) => section.id === targetId) ?? null : null
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
      user_id: orgId,
      profile: nextProfile as Json,
    })

  if (upsertError) {
    return { error: upsertError.message }
  }

  const cleanupPath = resolveOrgMediaCleanupPath({
    previousUrl: previousSection?.imageUrl ?? null,
    nextUrl: null,
    userId: orgId,
  })

  if (cleanupPath) {
    await supabase.storage.from(ORG_MEDIA_BUCKET).remove([cleanupPath])
  }

  revalidatePath("/roadmap")
  if (orgRow?.public_slug) {
    revalidatePath(`/${orgRow.public_slug}/roadmap`)
  }

  const notifyResult = await createNotification(supabase, {
    userId: user.id,
    title: nextPublic ? "Roadmap published" : "Roadmap unpublished",
    description: nextPublic
      ? "Your public roadmap is now live."
      : "Your public roadmap is no longer visible.",
    href: "/my-organization",
    tone: nextPublic ? "success" : "info",
    type: nextPublic ? "roadmap_published" : "roadmap_unpublished",
    actorId: user.id,
    metadata: { isPublic: nextPublic },
  })
  if ("error" in notifyResult) {
    console.error("Failed to create roadmap visibility notification", notifyResult.error)
  }

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

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) return { error: "Forbidden" }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status, created_at")
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null }>()

  if (subscriptionError) {
    return { error: subscriptionError.message }
  }

  const canPublishPublicRoadmap =
    subscription?.status === "active" || subscription?.status === "trialing"

  if (!canPublishPublicRoadmap) {
    return { error: "Upgrade to Organization to publish your roadmap." }
  }

  const { data: orgRow, error } = await supabase
    .from("organizations")
    .upsert({
      user_id: orgId,
      is_public_roadmap: nextPublic,
    })
    .select("public_slug")
    .maybeSingle<{ public_slug: string | null }>()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/roadmap")
  if (orgRow?.public_slug) {
    revalidatePath(`/${orgRow.public_slug}/roadmap`)
  }

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

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  if (!canEditOrganization(role)) return { error: "Forbidden" }

  const nextHero = typeof heroUrl === "string" && heroUrl.trim().length > 0 ? heroUrl.trim() : null

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public_roadmap")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Json | null; public_slug: string | null; is_public_roadmap: boolean | null }>()

  if (orgError) {
    return { error: orgError.message }
  }

  const currentProfile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const currentRoadmap = isRecord(currentProfile.roadmap) ? (currentProfile.roadmap as Record<string, unknown>) : {}
  const previousHeroUrl = typeof currentRoadmap.heroUrl === "string" ? (currentRoadmap.heroUrl as string) : null
  const nextProfile = isRecord(currentProfile) ? { ...currentProfile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}
  roadmapRecord.heroUrl = nextHero
  nextProfile.roadmap = roadmapRecord

  const cleanupPath = resolveOrgMediaCleanupPath({
    previousUrl: previousHeroUrl,
    nextUrl: nextHero,
    userId: orgId,
  })

  const { error: upsertError } = await supabase
    .from("organizations")
    .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })

  if (upsertError) {
    return { error: upsertError.message }
  }

  if (cleanupPath) {
    await supabase.storage.from(ORG_MEDIA_BUCKET).remove([cleanupPath])
  }

  revalidatePath("/roadmap")
  if (orgRow?.public_slug && orgRow?.is_public_roadmap) {
    revalidatePath(`/${orgRow.public_slug}/roadmap`)
  }

  return { ok: true }
}
