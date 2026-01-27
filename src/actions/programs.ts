/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import { requireServerSession } from "@/lib/auth"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { PROGRAM_MEDIA_BUCKET, resolveProgramMediaCleanupPath } from "@/lib/storage/program-media"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

export type CreateProgramPayload = {
  title: string
  subtitle?: string | null
  description?: string | null
  location?: string | null
  locationType?: "in_person" | "online" | null
  locationUrl?: string | null
  teamIds?: string[] | null
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
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const canEdit = canEditOrganization(role)
  if (!canEdit) return { error: "Forbidden" }
  const allowPublicSharing = publicSharingEnabled

  const insert = {
    user_id: orgId,
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    description: payload.description ?? null,
    location: payload.location ?? null,
    location_type: payload.locationType ?? "in_person",
    location_url: payload.locationUrl ?? null,
    team_ids: payload.teamIds ?? [],
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
  await revalidateOrganizationProgramViews(supabase, orgId)
  return { ok: true }
}

export type UpdateProgramPayload = Partial<CreateProgramPayload>

export async function updateProgramAction(id: string, payload: UpdateProgramPayload) {
  const { supabase, session } = await requireServerSession("/my-organization")
  const userId = session.user.id
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const canEdit = canEditOrganization(role)
  if (!canEdit) return { error: "Forbidden" }
  const allowPublicSharing = publicSharingEnabled
  const imageTouched = Object.prototype.hasOwnProperty.call(payload, "imageUrl")
  const hasKey = (key: keyof UpdateProgramPayload) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  const pick = <K extends keyof UpdateProgramPayload>(key: K): UpdateProgramPayload[K] | undefined =>
    hasKey(key) ? payload[key] : undefined

  let previousImageUrl: string | null = null
  if (imageTouched) {
    const { data: existing, error: existingError } = await (supabase
      .from("programs") as any)
      .select("image_url")
      .eq("id", id)
      .eq("user_id", orgId)
      .maybeSingle()

    if (existingError) return { error: existingError.message }
    const existingRow = existing as { image_url?: string | null } | null
    previousImageUrl = existingRow?.image_url ?? null
  }

  const startDate = pick("startDate")
  const endDate = pick("endDate")
  const isPublic = pick("isPublic")

  const update = {
    title: pick("title"),
    subtitle: pick("subtitle"),
    description: pick("description"),
    location: pick("location"),
    location_type: pick("locationType") ?? undefined,
    location_url: pick("locationUrl"),
    team_ids: pick("teamIds") ?? undefined,
    address_street: pick("addressStreet"),
    address_city: pick("addressCity"),
    address_state: pick("addressState"),
    address_postal: pick("addressPostal"),
    address_country: pick("addressCountry"),
    image_url: payload.imageUrl === null ? null : payload.imageUrl ?? undefined,
    duration_label: pick("duration"),
    start_date:
      startDate === undefined ? undefined : startDate ? (new Date(startDate).toISOString() as unknown as any) : null,
    end_date:
      endDate === undefined ? undefined : endDate ? (new Date(endDate).toISOString() as unknown as any) : null,
    features: pick("features"),
    status_label: pick("statusLabel"),
    goal_cents: pick("goalCents"),
    raised_cents: pick("raisedCents"),
    is_public: isPublic === undefined ? undefined : allowPublicSharing ? Boolean(isPublic) : false,
    cta_label: pick("ctaLabel"),
    cta_url: pick("ctaUrl"),
  }

  const { error } = await (supabase
    .from("programs") as any)
    .update(update)
    .eq("id", id)
    .eq("user_id", orgId)

  if (error) return { error: error.message }

  if (imageTouched) {
    const cleanupPath = resolveProgramMediaCleanupPath({
      previousUrl: previousImageUrl,
      nextUrl: payload.imageUrl ?? null,
      userId: orgId,
    })
    if (cleanupPath) {
      await supabase.storage.from(PROGRAM_MEDIA_BUCKET).remove([cleanupPath])
    }
  }
  await revalidateOrganizationProgramViews(supabase, orgId)
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
 
