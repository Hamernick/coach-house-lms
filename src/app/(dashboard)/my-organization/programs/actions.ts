/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import { requireServerSession } from "@/lib/auth"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { PROGRAM_MEDIA_BUCKET, resolveProgramMediaCleanupPath } from "@/lib/storage/program-media"

export type CreateProgramPayload = {
  title: string
  subtitle?: string | null
  description?: string | null
  location?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  imageUrl?: string | null
  duration?: string | null
  startDate?: string | null
  endDate?: string | null
  features?: string[] | null
  statusLabel?: string | null
  goalCents?: number | null
  raisedCents?: number | null
  isPublic?: boolean | null
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export async function createProgramAction(payload: CreateProgramPayload) {
  const { supabase, session } = await requireServerSession("/my-organization")
  const userId = session.user.id
  const allowPublicSharing = publicSharingEnabled

  const insert = {
    user_id: userId,
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    description: payload.description ?? null,
    location: payload.location ?? null,
    address_street: payload.addressStreet ?? null,
    address_city: payload.addressCity ?? null,
    address_state: payload.addressState ?? null,
    address_postal: payload.addressPostal ?? null,
    address_country: payload.addressCountry ?? null,
    image_url: payload.imageUrl ?? null,
    duration_label: payload.duration ?? null,
    start_date: payload.startDate ? new Date(payload.startDate).toISOString() as unknown as any : null,
    end_date: payload.endDate ? new Date(payload.endDate).toISOString() as unknown as any : null,
    features: payload.features ?? [],
    status_label: payload.statusLabel ?? null,
    goal_cents: payload.goalCents ?? 0,
    raised_cents: payload.raisedCents ?? 0,
    is_public: allowPublicSharing ? Boolean(payload.isPublic ?? false) : false,
    cta_label: payload.ctaLabel ?? null,
    cta_url: payload.ctaUrl ?? null,
  }

  const { error } = await (supabase.from("programs") as any).insert(insert)
  if (error) return { error: error.message }
  await revalidateOrganizationProgramViews(supabase, userId)
  return { ok: true }
}

export type UpdateProgramPayload = Partial<CreateProgramPayload>

export async function updateProgramAction(id: string, payload: UpdateProgramPayload) {
  const { supabase, session } = await requireServerSession("/my-organization")
  const userId = session.user.id
  const allowPublicSharing = publicSharingEnabled
  const imageTouched = Object.prototype.hasOwnProperty.call(payload, "imageUrl")

  let previousImageUrl: string | null = null
  if (imageTouched) {
    const { data: existing, error: existingError } = await (supabase
      .from("programs") as any)
      .select("image_url")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()

    if (existingError) return { error: existingError.message }
    const existingRow = existing as { image_url?: string | null } | null
    previousImageUrl = existingRow?.image_url ?? null
  }

  const update = {
    title: payload.title ?? undefined,
    subtitle: payload.subtitle ?? undefined,
    description: payload.description ?? undefined,
    location: payload.location ?? undefined,
    address_street: payload.addressStreet ?? undefined,
    address_city: payload.addressCity ?? undefined,
    address_state: payload.addressState ?? undefined,
    address_postal: payload.addressPostal ?? undefined,
    address_country: payload.addressCountry ?? undefined,
    image_url: payload.imageUrl === null ? null : payload.imageUrl ?? undefined,
    duration_label: payload.duration ?? undefined,
    start_date: payload.startDate ? (new Date(payload.startDate).toISOString() as unknown as any) : undefined,
    end_date: payload.endDate ? (new Date(payload.endDate).toISOString() as unknown as any) : undefined,
    features: payload.features ?? undefined,
    status_label: payload.statusLabel ?? undefined,
    goal_cents: payload.goalCents ?? undefined,
    raised_cents: payload.raisedCents ?? undefined,
    is_public: (allowPublicSharing ? payload.isPublic : false) ?? undefined,
    cta_label: payload.ctaLabel ?? undefined,
    cta_url: payload.ctaUrl ?? undefined,
  }

  const { error } = await (supabase
    .from("programs") as any)
    .update(update)
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  if (imageTouched) {
    const cleanupPath = resolveProgramMediaCleanupPath({
      previousUrl: previousImageUrl,
      nextUrl: payload.imageUrl ?? null,
      userId,
    })
    if (cleanupPath) {
      await supabase.storage.from(PROGRAM_MEDIA_BUCKET).remove([cleanupPath])
    }
  }
  await revalidateOrganizationProgramViews(supabase, userId)
  return { ok: true }
}

async function revalidateOrganizationProgramViews(supabase: Awaited<ReturnType<typeof requireServerSession>>["supabase"], userId: string) {
  revalidatePath("/my-organization")
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("public_slug, is_public")
      .eq("user_id", userId)
      .maybeSingle<{ public_slug: string | null; is_public: boolean | null }>()

    if (error) return

    const slug = typeof data?.public_slug === "string" && data.public_slug.length > 0 ? data.public_slug : null
    const isPublic = Boolean(data?.is_public)

    if (isPublic) revalidatePath("/community")
    if (slug) revalidatePath(`/${slug}`)
  } catch {
    // Swallow revalidation errors; they should not block program writes.
  }
}
 
