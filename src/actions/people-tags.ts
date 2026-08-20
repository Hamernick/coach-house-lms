"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import {
  isOrganizationPeopleTagUuid,
  MAX_ORGANIZATION_PERSON_TAGS,
  normalizeOrganizationPeopleTagColor,
  normalizePersonTag,
  type OrganizationPeopleTag,
  type OrganizationPeopleTagColor,
} from "@/lib/people/tags"

type SessionSupabase = Awaited<
  ReturnType<typeof requireServerSession>
>["supabase"]
type TagActionError = { error: string }

function normalizePersonIds(personIds: string[]) {
  return Array.from(
    new Set(
      personIds
        .map((personId) => personId.trim())
        .filter((personId) => personId.length > 0 && personId.length <= 128)
    )
  )
}

async function resolveTagManagementAccess(
  supabase: SessionSupabase,
  userId: string
) {
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  if (canEditOrganization(role)) return { orgId, canManageTags: true }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  return { orgId, canManageTags: profileRow?.role === "admin" }
}

async function validateOrganizationPersonIds({
  orgId,
  personIds,
  supabase,
}: {
  orgId: string
  personIds: string[]
  supabase: SessionSupabase
}): Promise<{ ok: true } | TagActionError> {
  const { data, error } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (error) return { error: error.message }
  if (!data) return { error: "Organization not found." }

  const validPersonIds = new Set(
    (Array.isArray(data.profile?.org_people)
      ? data.profile.org_people
      : []
    ).flatMap((person) => {
      if (!person || typeof person !== "object") return []
      const id = (person as Record<string, unknown>).id
      return typeof id === "string" && id ? [id] : []
    })
  )
  return personIds.some((personId) => !validPersonIds.has(personId))
    ? { error: "One or more people no longer belong to this organization." }
    : { ok: true as const }
}

async function resolveOrganizationPeopleTagId({
  orgId,
  tagId,
  supabase,
}: {
  orgId: string
  tagId: string
  supabase: SessionSupabase
}): Promise<{ tagId: string } | TagActionError> {
  if (!isOrganizationPeopleTagUuid(tagId)) return { error: "Tag not found." }

  const { data, error } = await supabase
    .from("organization_people_tags")
    .select("id")
    .eq("id", tagId)
    .eq("org_id", orgId)
    .maybeSingle<{ id: string }>()
  if (error) return { error: error.message }
  return data ? { tagId: data.id } : { error: "Tag not found." }
}

function revalidatePeopleSurfaces() {
  revalidatePath("/my-organization")
  revalidatePath("/people")
}

export async function createOrganizationPeopleTagAction({
  color,
  label,
  personId,
}: {
  color: OrganizationPeopleTagColor
  label: string
  personId?: string
}) {
  const normalizedLabel = normalizePersonTag(label)
  if (!normalizedLabel) return { error: "Enter a tag name." }
  const normalizedColor = normalizeOrganizationPeopleTagColor(color)
  const normalizedPersonIds = personId ? normalizePersonIds([personId]) : []

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageTags } = await resolveTagManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageTags) return { error: "Forbidden" }

  if (normalizedPersonIds.length > 0) {
    const validation = await validateOrganizationPersonIds({
      orgId,
      personIds: normalizedPersonIds,
      supabase,
    })
    if ("error" in validation) return validation
  }

  const { count, error: countError } = await supabase
    .from("organization_people_tags")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
  if (countError) return { error: countError.message }
  if ((count ?? 0) >= MAX_ORGANIZATION_PERSON_TAGS) {
    return { error: "This organization has reached its tag limit." }
  }

  const orderResult = await supabase
    .from("organization_people_tags")
    .select("sort_order")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>()
  if (orderResult.error) return { error: orderResult.error.message }

  const { data, error } = await supabase
    .from("organization_people_tags")
    .insert({
      org_id: orgId,
      label: normalizedLabel,
      color: normalizedColor,
      sort_order: (orderResult.data?.sort_order ?? -1) + 1,
      created_by: session.user.id,
    })
    .select("id,label,color")
    .single<{ id: string; label: string; color: string }>()
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A tag with that name already exists."
          : error.message,
    }
  }

  if (normalizedPersonIds[0]) {
    const membershipResult = await supabase
      .from("organization_people_tag_members")
      .insert({
        tag_id: data.id,
        person_id: normalizedPersonIds[0],
        added_by: session.user.id,
      })
    if (membershipResult.error) {
      await supabase
        .from("organization_people_tags")
        .delete()
        .eq("id", data.id)
        .eq("org_id", orgId)
      return { error: membershipResult.error.message }
    }
  }

  const tag: OrganizationPeopleTag = {
    id: data.id,
    label: data.label,
    color: normalizeOrganizationPeopleTagColor(data.color),
    memberIds: normalizedPersonIds,
  }
  revalidatePeopleSurfaces()
  return { ok: true as const, tag }
}

export async function updateOrganizationPeopleTagAction({
  color,
  label,
  tagId,
}: {
  color: OrganizationPeopleTagColor
  label: string
  tagId: string
}) {
  const normalizedLabel = normalizePersonTag(label)
  if (!normalizedLabel) return { error: "Enter a tag name." }
  const normalizedColor = normalizeOrganizationPeopleTagColor(color)

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageTags } = await resolveTagManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageTags) return { error: "Forbidden" }

  const tagResult = await resolveOrganizationPeopleTagId({
    orgId,
    tagId,
    supabase,
  })
  if ("error" in tagResult) return tagResult

  const { data, error } = await supabase
    .from("organization_people_tags")
    .update({ label: normalizedLabel, color: normalizedColor })
    .eq("id", tagResult.tagId)
    .eq("org_id", orgId)
    .select("id,label,color")
    .maybeSingle<{ id: string; label: string; color: string }>()
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "A tag with that name already exists."
          : error.message,
    }
  }
  if (!data) return { error: "Tag not found." }

  revalidatePeopleSurfaces()
  return {
    ok: true as const,
    tag: {
      id: data.id,
      label: data.label,
      color: normalizeOrganizationPeopleTagColor(data.color),
    },
  }
}

export async function deleteOrganizationPeopleTagAction(tagId: string) {
  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageTags } = await resolveTagManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageTags) return { error: "Forbidden" }

  const tagResult = await resolveOrganizationPeopleTagId({
    orgId,
    tagId,
    supabase,
  })
  if ("error" in tagResult) return tagResult

  const { data, error } = await supabase
    .from("organization_people_tags")
    .delete()
    .eq("id", tagResult.tagId)
    .eq("org_id", orgId)
    .select("id")
    .maybeSingle<{ id: string }>()
  if (error) return { error: error.message }
  if (!data) return { error: "Tag not found." }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}

export async function addOrganizationPeopleTagMembersAction(
  tagId: string,
  personIds: string[]
) {
  const normalizedPersonIds = normalizePersonIds(personIds)
  if (normalizedPersonIds.length === 0) return { ok: true as const }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageTags } = await resolveTagManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageTags) return { error: "Forbidden" }

  const tagResult = await resolveOrganizationPeopleTagId({
    orgId,
    tagId,
    supabase,
  })
  if ("error" in tagResult) return tagResult
  const validation = await validateOrganizationPersonIds({
    orgId,
    personIds: normalizedPersonIds,
    supabase,
  })
  if ("error" in validation) return validation

  const { error } = await supabase
    .from("organization_people_tag_members")
    .upsert(
      normalizedPersonIds.map((personId) => ({
        tag_id: tagResult.tagId,
        person_id: personId,
        added_by: session.user.id,
      })),
      { onConflict: "tag_id,person_id", ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}

export async function removeOrganizationPeopleTagMembersAction(
  tagId: string,
  personIds: string[]
) {
  const normalizedPersonIds = normalizePersonIds(personIds)
  if (normalizedPersonIds.length === 0) return { ok: true as const }

  const { supabase, session } = await requireServerSession("/my-organization")
  const { orgId, canManageTags } = await resolveTagManagementAccess(
    supabase,
    session.user.id
  )
  if (!canManageTags) return { error: "Forbidden" }

  const tagResult = await resolveOrganizationPeopleTagId({
    orgId,
    tagId,
    supabase,
  })
  if ("error" in tagResult) return tagResult

  const { error } = await supabase
    .from("organization_people_tag_members")
    .delete()
    .eq("tag_id", tagResult.tagId)
    .in("person_id", normalizedPersonIds)
  if (error) return { error: error.message }

  revalidatePeopleSurfaces()
  return { ok: true as const }
}
