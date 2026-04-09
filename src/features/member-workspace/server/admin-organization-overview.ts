import { addDays } from "date-fns"

import type { Database, Json } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type {
  MemberWorkspaceAdminOrganizationMember,
  MemberWorkspaceAdminOrganizationSummary,
} from "@/features/member-workspace/types"
import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabProject,
  PlatformAdminDashboardLabStatus,
} from "@/features/platform-admin-dashboard"
import type { OrganizationProjectRecord } from "./project-starter-data"

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>

type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  | "user_id"
  | "status"
  | "profile"
  | "created_at"
  | "updated_at"
  | "public_slug"
  | "is_public"
  | "location_lat"
  | "location_lng"
>

type MembershipRow = Pick<
  Database["public"]["Tables"]["organization_memberships"]["Row"],
  "org_id" | "member_id" | "role" | "member_email" | "created_at"
>

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "avatar_url" | "headline" | "email" | "role"
>

function toRecord(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function hasText(value: unknown) {
  return toTrimmedString(value).length > 0
}

function resolveOrganizationName({
  organization,
  ownerProfile,
}: {
  organization: OrganizationRow
  ownerProfile: ProfileRow | null
}) {
  const profile = toRecord(organization.profile)
  const name = toTrimmedString(profile.name)
  if (name) return name

  const ownerName = toTrimmedString(ownerProfile?.full_name)
  if (ownerName) return ownerName

  const publicSlug = toTrimmedString(organization.public_slug)
  if (publicSlug) return publicSlug

  return "Organization"
}

function rolePriority(role: string) {
  switch (role) {
    case "owner":
      return 0
    case "admin":
      return 1
    case "staff":
      return 2
    case "board":
      return 3
    default:
      return 4
  }
}

function computeSetupSummary({
  organization,
  memberCount,
}: {
  organization: OrganizationRow
  memberCount: number
}) {
  const profile = toRecord(organization.profile)
  const checks = [
    hasText(profile.name),
    hasText(profile.tagline) || hasText(profile.mission) || hasText(profile.vision),
    hasText(profile.logoUrl),
    Boolean(organization.public_slug) || hasText(profile.website),
    Boolean(organization.location_lat && organization.location_lng) ||
      hasText(profile.address) ||
      hasText(profile.addressCity) ||
      hasText(profile.addressState),
    memberCount > 0,
  ]

  const completedCount = checks.filter(Boolean).length
  const totalCount = checks.length

  return {
    setupProgress: Math.round((completedCount / totalCount) * 100),
    missingSetupCount: totalCount - completedCount,
  }
}

function resolveProjectStatus({
  organizationStatus,
  setupProgress,
}: {
  organizationStatus: OrganizationRow["status"]
  setupProgress: number
}): PlatformAdminDashboardLabStatus {
  if (setupProgress >= 100) return "completed"
  if (organizationStatus === "approved" || setupProgress >= 65) return "active"
  if (organizationStatus === "pending" || setupProgress >= 35) return "planned"
  return "backlog"
}

function resolveProjectPriority(setupProgress: number): PlatformAdminDashboardLabPriority {
  if (setupProgress < 35) return "urgent"
  if (setupProgress < 60) return "high"
  if (setupProgress < 85) return "medium"
  return "low"
}

function buildSummaryTags({
  organization,
  setupProgress,
}: {
  organization: OrganizationRow
  setupProgress: number
}) {
  const tags = new Set<string>()
  tags.add("organization")
  tags.add(
    organization.status === "approved"
      ? "approved"
      : organization.status === "pending"
        ? "pending"
        : "setup",
  )
  if (organization.is_public) tags.add("public")
  if (setupProgress < 100) tags.add("onboarding")
  return Array.from(tags)
}

function buildOrganizationMembers({
  organization,
  memberships,
  profilesById,
}: {
  organization: OrganizationRow
  memberships: MembershipRow[]
  profilesById: Map<string, ProfileRow>
}) {
  const profile = toRecord(organization.profile)
  const orgPeople = Array.isArray(profile.org_people)
    ? (profile.org_people as Array<Record<string, unknown>>)
    : []

  if (memberships.length === 0 && orgPeople.length > 0) {
    return orgPeople
      .map((person, index) => ({
        userId:
          toTrimmedString(person.id) ||
          `${organization.user_id}-person-${index + 1}`,
        name: toTrimmedString(person.name) || "Unknown member",
        email: toTrimmedString(person.email) || null,
        avatarUrl: toTrimmedString(person.image) || null,
        headline: toTrimmedString(person.title) || null,
        organizationRole: toTrimmedString(person.category) || "member",
        platformRole: null,
        isOwner: toTrimmedString(person.id) === organization.user_id,
      }))
      .sort((left, right) => {
        const roleDiff = rolePriority(left.organizationRole) - rolePriority(right.organizationRole)
        if (roleDiff !== 0) return roleDiff
        return left.name.localeCompare(right.name)
      })
  }

  return memberships
    .map((membership) => {
      const profileRow = profilesById.get(membership.member_id) ?? null
      const name =
        toTrimmedString(profileRow?.full_name) ||
        toTrimmedString(membership.member_email) ||
        "Unknown member"

      return {
        userId: membership.member_id,
        name,
        email: toTrimmedString(profileRow?.email) || toTrimmedString(membership.member_email) || null,
        avatarUrl: toTrimmedString(profileRow?.avatar_url) || null,
        headline: toTrimmedString(profileRow?.headline) || null,
        organizationRole: membership.role,
        platformRole: profileRow?.role ?? null,
        isOwner: membership.member_id === organization.user_id,
      }
    })
    .sort((left, right) => {
      const roleDiff = rolePriority(left.organizationRole) - rolePriority(right.organizationRole)
      if (roleDiff !== 0) return roleDiff
      return left.name.localeCompare(right.name)
    })
}

function buildOrganizationSummary({
  organization,
  memberships,
  profilesById,
}: {
  organization: OrganizationRow
  memberships: MembershipRow[]
  profilesById: Map<string, ProfileRow>
}): MemberWorkspaceAdminOrganizationSummary {
  const ownerProfile = profilesById.get(organization.user_id) ?? null
  const members = buildOrganizationMembers({
    organization,
    memberships,
    profilesById,
  })
  const { setupProgress, missingSetupCount } = computeSetupSummary({
    organization,
    memberCount: members.length,
  })

  return {
    orgId: organization.user_id,
    canonicalProjectId: null,
    name: resolveOrganizationName({ organization, ownerProfile }),
    publicSlug: organization.public_slug ?? null,
    organizationStatus: organization.status,
    isPublic: Boolean(organization.is_public),
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
    setupProgress,
    missingSetupCount,
    memberCount: members.length,
    tags: buildSummaryTags({ organization, setupProgress }),
    members,
    profile: toRecord(organization.profile),
  }
}

async function loadProfilesById({
  supabase,
  ids,
}: {
  supabase: ServerSupabase
  ids: string[]
}) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (uniqueIds.length === 0) return new Map<string, ProfileRow>()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, headline, email, role")
    .in("id", uniqueIds)
    .returns<ProfileRow[]>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load platform member profiles.")
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile] as const))
}

export async function loadAdminOrganizationSummaries({
  supabase,
}: {
  supabase: ServerSupabase
}) {
  const [{ data: organizations, error: organizationsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("user_id, status, profile, created_at, updated_at, public_slug, is_public, location_lat, location_lng")
        .order("updated_at", { ascending: false })
        .returns<OrganizationRow[]>(),
      supabase
        .from("organization_memberships")
        .select("org_id, member_id, role, member_email, created_at")
        .returns<MembershipRow[]>(),
    ])

  if (organizationsError) {
    throw supabaseErrorToError(organizationsError, "Unable to load organizations.")
  }
  if (membershipsError) {
    throw supabaseErrorToError(membershipsError, "Unable to load organization memberships.")
  }

  const organizationRows = organizations ?? []
  const membershipRows = memberships ?? []
  const profilesById = await loadProfilesById({
    supabase,
    ids: [
      ...organizationRows.map((organization) => organization.user_id),
      ...membershipRows.map((membership) => membership.member_id),
    ],
  })

  const membershipsByOrgId = new Map<string, MembershipRow[]>()
  for (const membership of membershipRows) {
    const list = membershipsByOrgId.get(membership.org_id) ?? []
    list.push(membership)
    membershipsByOrgId.set(membership.org_id, list)
  }

  return organizationRows
    .map((organization) =>
      buildOrganizationSummary({
        organization,
        memberships: membershipsByOrgId.get(organization.user_id) ?? [],
        profilesById,
      }),
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function loadAdminOrganizationSummaryById({
  supabase,
  orgId,
}: {
  supabase: ServerSupabase
  orgId: string
}) {
  const [{ data: organization, error: organizationError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("user_id, status, profile, created_at, updated_at, public_slug, is_public, location_lat, location_lng")
        .eq("user_id", orgId)
        .maybeSingle<OrganizationRow>(),
      supabase
        .from("organization_memberships")
        .select("org_id, member_id, role, member_email, created_at")
        .eq("org_id", orgId)
        .returns<MembershipRow[]>(),
    ])

  if (organizationError) {
    throw supabaseErrorToError(organizationError, "Unable to load organization.")
  }
  if (!organization) {
    return null
  }
  if (membershipsError) {
    throw supabaseErrorToError(membershipsError, "Unable to load organization memberships.")
  }

  const profilesById = await loadProfilesById({
    supabase,
    ids: [organization.user_id, ...(memberships ?? []).map((membership) => membership.member_id)],
  })

  return buildOrganizationSummary({
    organization,
    memberships: memberships ?? [],
    profilesById,
  })
}

export function mapAdminOrganizationSummaryToProject(
  organization: MemberWorkspaceAdminOrganizationSummary,
): PlatformAdminDashboardLabProject {
  const now = new Date()
  const createdAt = new Date(organization.createdAt)
  const endDate =
    organization.setupProgress >= 100
      ? addDays(now, 14)
      : addDays(now, Math.max(21, organization.missingSetupCount * 7))
  const status = resolveProjectStatus({
    organizationStatus: organization.organizationStatus,
    setupProgress: organization.setupProgress,
  })

  return {
    id: organization.orgId,
    name: organization.name,
    taskCount: organization.missingSetupCount,
    progress: organization.setupProgress,
    startDate: createdAt,
    endDate,
    status,
    priority: resolveProjectPriority(organization.setupProgress),
    tags: organization.tags,
    members: organization.members.slice(0, 4).map((member) => member.name),
    client:
      organization.publicSlug && organization.publicSlug.length > 0
        ? `/${organization.publicSlug}`
        : organization.isPublic
          ? "Public profile enabled"
          : "Private organization",
    typeLabel:
      organization.organizationStatus === "approved"
        ? "Approved nonprofit"
        : organization.organizationStatus === "pending"
          ? "Pending setup"
          : "Organization account",
    durationLabel: `${organization.memberCount} member${organization.memberCount === 1 ? "" : "s"}`,
    tasks: [],
  }
}

export function mapAdminOrganizationSummaryToProjectRecord(
  organization: MemberWorkspaceAdminOrganizationSummary,
): OrganizationProjectRecord {
  const project = mapAdminOrganizationSummaryToProject(organization)

  return {
    id: organization.canonicalProjectId ?? organization.orgId,
    org_id: organization.orgId,
    canonical_org_id: organization.orgId,
    project_kind: "organization_admin",
    name: project.name,
    description: project.description ?? null,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    start_date: project.startDate.toISOString().slice(0, 10),
    end_date: project.endDate.toISOString().slice(0, 10),
    client_name: project.client ?? null,
    type_label: project.typeLabel ?? null,
    duration_label: project.durationLabel ?? null,
    tags: project.tags,
    member_labels: project.members,
    task_count: project.taskCount,
    created_source: "system",
    starter_seed_key: null,
    starter_seed_version: null,
    created_by: organization.orgId,
    updated_by: organization.orgId,
    created_at: organization.createdAt,
    updated_at: organization.updatedAt,
  }
}
