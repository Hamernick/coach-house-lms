"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import type { OrganizationPeopleSegment } from "@/lib/people/segments"
import { isWorkspaceFoundationRolloutEnabled } from "@/lib/workspace/foundation-rollout"

type SessionSupabase = Awaited<
  ReturnType<typeof requireServerSession>
>["supabase"]
type SegmentActionError = { error: string }
type SegmentActionSuccess = { ok: true }

function normalizeSegmentLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").slice(0, 48)
}

function normalizePersonIds(personIds: string[]) {
  return Array.from(
    new Set(
      personIds
        .map((personId) => personId.trim())
        .filter((personId) => personId.length > 0 && personId.length <= 128)
    )
  )
}

async function resolveSegmentManagementAccess(
  supabase: SessionSupabase,
  userId: string
) {
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  if (!isWorkspaceFoundationRolloutEnabled({ orgId, userId })) {
    return { orgId, canManageSegments: false }
  }
  if (canEditOrganization(role)) return { orgId, canManageSegments: true }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  return {
    orgId,
    canManageSegments: profileRow?.role === "admin",
  }
}

async function readOrganizationProfile(
  supabase: SessionSupabase,
  orgId: string
): Promise<{ profile: Record<string, unknown> } | SegmentActionError> {
  const { data, error } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (error) return { error: error.message as string }
  if (!data) return { error: "Organization not found." }
  return { profile: data.profile ?? {} }
}

function revalidatePeopleSurfaces() {
  revalidatePath("/my-organization")
  revalidatePath("/people")
}

export async function createOrganizationPeopleSegmentAction(
  label: string,
  personIds: string[] = []
) {
  const normalizedLabel = normalizeSegmentLabel(label)
  const normalizedPersonIds = normalizePersonIds(personIds)
  if (!normalizedLabel) return { error: "Enter a segment name." }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageSegments } = await resolveSegmentManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageSegments) return { error: "Forbidden" }
  if (normalizedPersonIds.length > 0) {
    const validationResult = await validateOrganizationPersonIds({
      orgId,
      personIds: normalizedPersonIds,
      supabase,
    })
    if ("error" in validationResult) return validationResult
  }

  const orderResult = await supabase
    .from("organization_people_segments")
    .select("sort_order")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>()

  if (orderResult.error) return { error: orderResult.error.message }

  const { data, error } = await supabase
    .from("organization_people_segments")
    .insert({
      org_id: orgId,
      label: normalizedLabel,
      sort_order: (orderResult.data?.sort_order ?? -1) + 1,
      created_by: session.user.id,
    })
    .select("id,label")
    .single<{ id: string; label: string }>()
  if (error) return { error: error.message }

  if (normalizedPersonIds.length > 0) {
    const { error: membersError } = await supabase
      .from("organization_people_segment_members")
      .insert(
        normalizedPersonIds.map((personId) => ({
          segment_id: data.id,
          person_id: personId,
          added_by: session.user.id,
        }))
      )
    if (membersError) {
      await supabase
        .from("organization_people_segments")
        .delete()
        .eq("id", data.id)
        .eq("org_id", orgId)
      return { error: membersError.message }
    }
  }

  const segment: OrganizationPeopleSegment = {
    id: data.id,
    label: data.label,
    memberIds: normalizedPersonIds,
  }
  revalidatePeopleSurfaces()
  return { ok: true as const, segment }
}

export async function renameOrganizationPeopleSegmentAction(
  segmentId: string,
  label: string
) {
  const normalizedLabel = normalizeSegmentLabel(label)
  if (!normalizedLabel) return { error: "Enter a segment name." }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageSegments } = await resolveSegmentManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageSegments) return { error: "Forbidden" }

  const { data, error } = await supabase
    .from("organization_people_segments")
    .update({ label: normalizedLabel })
    .eq("id", segmentId)
    .eq("org_id", orgId)
    .select("id")
    .maybeSingle<{ id: string }>()

  if (error) return { error: error.message }
  if (!data) return { error: "Segment not found." }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}

export async function deleteOrganizationPeopleSegmentAction(segmentId: string) {
  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageSegments } = await resolveSegmentManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageSegments) return { error: "Forbidden" }

  const { data, error } = await supabase
    .from("organization_people_segments")
    .delete()
    .eq("id", segmentId)
    .eq("org_id", orgId)
    .select("id")
    .maybeSingle<{ id: string }>()

  if (error) return { error: error.message }
  if (!data) return { error: "Segment not found." }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}

async function validateOrganizationPersonIds({
  orgId,
  personIds,
  supabase,
}: {
  orgId: string
  personIds: string[]
  supabase: SessionSupabase
}): Promise<SegmentActionSuccess | SegmentActionError> {
  const profileResult = await readOrganizationProfile(supabase, orgId)
  if ("error" in profileResult) return profileResult
  const validPersonIds = new Set(
    (Array.isArray(profileResult.profile.org_people)
      ? profileResult.profile.org_people
      : []
    ).flatMap((person) => {
      if (!person || typeof person !== "object") return []
      const id = (person as Record<string, unknown>).id
      return typeof id === "string" && id ? [id] : []
    })
  )
  const invalidPersonId = personIds.find(
    (personId) => !validPersonIds.has(personId)
  )
  return invalidPersonId
    ? { error: "One or more people no longer belong to this organization." }
    : { ok: true as const }
}

export async function addOrganizationPeopleSegmentMembersAction(
  segmentId: string,
  personIds: string[]
) {
  const normalizedPersonIds = normalizePersonIds(personIds)
  if (normalizedPersonIds.length === 0) return { ok: true as const }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageSegments } = await resolveSegmentManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageSegments) return { error: "Forbidden" }
  const validationResult = await validateOrganizationPersonIds({
    orgId,
    personIds: normalizedPersonIds,
    supabase,
  })
  if ("error" in validationResult) return validationResult

  const segmentResult = await supabase
    .from("organization_people_segments")
    .select("id")
    .eq("id", segmentId)
    .eq("org_id", orgId)
    .maybeSingle<{ id: string }>()

  if (segmentResult.error) return { error: segmentResult.error.message }
  if (!segmentResult.data) return { error: "Segment not found." }

  const { error } = await supabase
    .from("organization_people_segment_members")
    .upsert(
      normalizedPersonIds.map((personId) => ({
        segment_id: segmentId,
        person_id: personId,
        added_by: session.user.id,
      })),
      { onConflict: "segment_id,person_id", ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}

export async function removeOrganizationPeopleSegmentMembersAction(
  segmentId: string,
  personIds: string[]
) {
  const normalizedPersonIds = normalizePersonIds(personIds)
  if (normalizedPersonIds.length === 0) return { ok: true as const }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageSegments } = await resolveSegmentManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageSegments) return { error: "Forbidden" }

  const segmentResult = await supabase
    .from("organization_people_segments")
    .select("id")
    .eq("id", segmentId)
    .eq("org_id", orgId)
    .maybeSingle<{ id: string }>()

  if (segmentResult.error) return { error: segmentResult.error.message }
  if (!segmentResult.data) return { error: "Segment not found." }

  const { error } = await supabase
    .from("organization_people_segment_members")
    .delete()
    .eq("segment_id", segmentId)
    .in("person_id", normalizedPersonIds)
  if (error) return { error: error.message }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}
