import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { MemberWorkspacePersonOption } from "../types"

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

type OrganizationPeopleRow = Pick<Database["public"]["Tables"]["organizations"]["Row"], "user_id">

type MembershipPeopleRow = Pick<
  Database["public"]["Tables"]["organization_memberships"]["Row"],
  "org_id" | "member_id" | "member_email"
>

type ProfilePeopleRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "avatar_url" | "email"
>

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function optionKey({
  id,
  email,
  name,
}: {
  id: string | null
  email: string | null
  name: string
}) {
  if (id) return `id:${id}`
  if (email) return `email:${email.toLowerCase()}`
  return `name:${name.toLowerCase()}`
}

function upsertPersonOption({
  map,
  id,
  name,
  email,
  avatarUrl,
}: {
  map: Map<string, MemberWorkspacePersonOption>
  id: string | null
  name: string | null
  email?: string | null
  avatarUrl?: string | null
}) {
  const normalizedName = toTrimmedString(name)
  if (!normalizedName) return

  const normalizedId = toTrimmedString(id) || null
  const normalizedEmail = toTrimmedString(email) || null
  const normalizedAvatarUrl = toTrimmedString(avatarUrl) || null
  const key = optionKey({
    id: normalizedId,
    email: normalizedEmail,
    name: normalizedName,
  })
  const existing = map.get(key)

  map.set(key, {
    id: normalizedId ?? normalizedEmail ?? normalizedName.toLowerCase().replace(/\s+/g, "-"),
    name: normalizedName,
    avatarUrl: normalizedAvatarUrl ?? existing?.avatarUrl ?? null,
  })
}

export async function loadMemberWorkspacePersonOptionsForOrganizations({
  orgIds,
  supabase,
}: {
  orgIds: string[]
  supabase: ServerSupabase
}): Promise<MemberWorkspacePersonOption[]> {
  const uniqueOrgIds = Array.from(new Set(orgIds.filter(Boolean)))
  if (uniqueOrgIds.length === 0) {
    return []
  }

  const [{ data: organizations, error: organizationsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("user_id")
        .in("user_id", uniqueOrgIds)
        .returns<OrganizationPeopleRow[]>(),
      supabase
        .from("organization_memberships")
        .select("org_id, member_id, member_email")
        .in("org_id", uniqueOrgIds)
        .returns<MembershipPeopleRow[]>(),
    ])

  if (organizationsError) {
    throw supabaseErrorToError(organizationsError, "Unable to load organization people.")
  }

  if (membershipsError) {
    throw supabaseErrorToError(membershipsError, "Unable to load organization memberships.")
  }

  const profileIds = Array.from(
    new Set(
      [
        ...(organizations ?? []).map((organization) => organization.user_id),
        ...(memberships ?? []).map((membership) => membership.member_id),
      ].filter(Boolean),
    ),
  )

  let profilesById = new Map<string, ProfilePeopleRow>()
  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", profileIds)
      .returns<ProfilePeopleRow[]>()

    if (profilesError) {
      throw supabaseErrorToError(profilesError, "Unable to load member profiles.")
    }

    profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile] as const))
  }

  const options = new Map<string, MemberWorkspacePersonOption>()

  for (const organization of organizations ?? []) {
    const ownerProfile = profilesById.get(organization.user_id) ?? null
    upsertPersonOption({
      map: options,
      id: ownerProfile?.id ?? organization.user_id,
      name: ownerProfile?.full_name ?? ownerProfile?.email ?? "Organization owner",
      email: ownerProfile?.email ?? null,
      avatarUrl: ownerProfile?.avatar_url ?? null,
    })
  }

  for (const membership of memberships ?? []) {
    const profile = profilesById.get(membership.member_id) ?? null
    upsertPersonOption({
      map: options,
      id: membership.member_id,
      name: profile?.full_name ?? membership.member_email ?? "Unknown member",
      email: profile?.email ?? membership.member_email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    })
  }

  return Array.from(options.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  )
}
