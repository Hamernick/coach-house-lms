import {
  BOARD_MEETING_REMINDER_TYPE,
  readBoardMeetingReminderMetadata,
} from "@/features/board-notifications"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type OrganizationProfileRecord = Record<string, unknown> | null
type PublicMapJoinedOrganization = {
  id: string
  name: string
  tagline: string | null
  logoUrl: string | null
  publicSlug: string | null
  role: "owner" | "admin" | "staff" | "board" | "member"
  canOpenWorkspace: boolean
}

type PublicMapBoardAlert = {
  id: string
  orgId: string
  orgName: string
  title: string
  startsAt: string
  href: string
}

type PublicMapMemberProfile = {
  name: string | null
  email: string | null
  avatarUrl: string | null
  title: string | null
  company: string | null
  contact: string | null
  about: string | null
}

export type PublicMapViewerState = {
  viewer: { id: string; email: string | null } | null
  memberProfile: PublicMapMemberProfile | null
  joinedOrganizations: PublicMapJoinedOrganization[]
  boardAlerts: PublicMapBoardAlert[]
  needsMemberOnboarding: boolean
  onboardingDefaults: ReturnType<typeof buildOnboardingFlowDefaults> | null
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readProfileString(profile: OrganizationProfileRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeString(profile?.[key])
    if (value) return value
  }
  return null
}

export async function fetchPublicMapViewerState(): Promise<PublicMapViewerState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      viewer: null,
      memberProfile: null,
      joinedOrganizations: [],
      boardAlerts: [],
      needsMemberOnboarding: false,
      onboardingDefaults: null,
    }
  }

  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const completed = Boolean(userMeta?.onboarding_completed)
  const intentFocus = normalizeString(userMeta?.onboarding_intent_focus)

  const [{ data: profileRow }, { data: memberships }, { data: notificationRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, headline, company, contact, about")
        .eq("id", user.id)
        .maybeSingle<{
          full_name: string | null
          avatar_url: string | null
          headline: string | null
          company: string | null
          contact: string | null
          about: string | null
        }>(),
      supabase
        .from("organization_memberships")
        .select("org_id, role")
        .eq("member_id", user.id)
        .returns<Array<{ org_id: string; role: "owner" | "admin" | "staff" | "board" | "member" }>>(),
      supabase
        .from("notifications")
        .select("id, org_id, title, href, metadata, created_at")
        .eq("user_id", user.id)
        .eq("type", BOARD_MEETING_REMINDER_TYPE)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<
          Array<{
            id: string
            org_id: string | null
            title: string
            href: string | null
            metadata: Record<string, unknown> | null
            created_at: string
          }>
        >(),
    ])

  const orgIds = Array.from(
    new Set(
      [...(memberships ?? []).map((membership) => membership.org_id), ...(notificationRows ?? []).flatMap((row) => (row.org_id ? [row.org_id] : []))].filter(Boolean),
    ),
  )

  const { data: organizationRows } =
    orgIds.length > 0
      ? await supabase
          .from("organizations")
          .select("user_id, public_slug, profile")
          .in("user_id", orgIds)
          .returns<
            Array<{
              user_id: string
              public_slug: string | null
              profile: Record<string, unknown> | null
            }>
          >()
      : { data: [] as Array<{ user_id: string; public_slug: string | null; profile: Record<string, unknown> | null }> }

  const orgById = new Map(
    (organizationRows ?? []).map((organization) => [organization.user_id, organization] as const),
  )

  const joinedOrganizations = (memberships ?? [])
    .map((membership) => {
      const organization = orgById.get(membership.org_id)
      const profile = organization?.profile ?? null
      return {
        id: membership.org_id,
        name: readProfileString(profile, "name") ?? "Organization",
        tagline: readProfileString(profile, "tagline", "description", "mission"),
        logoUrl: readProfileString(profile, "logoUrl", "logo_url", "headerUrl", "header_url"),
        publicSlug: organization?.public_slug ?? null,
        role: membership.role,
        canOpenWorkspace:
          membership.role === "owner" ||
          membership.role === "admin" ||
          membership.role === "staff" ||
          membership.role === "board",
      } satisfies PublicMapJoinedOrganization
    })
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    )

  const boardAlerts = (notificationRows ?? [])
    .map((notification) => {
      const metadata = readBoardMeetingReminderMetadata(notification.metadata)
      if (!metadata) return null
      const organization = notification.org_id ? orgById.get(notification.org_id) : null
      const profile = organization?.profile ?? null
      return {
        id: notification.id,
        orgId: notification.org_id ?? "",
        orgName: readProfileString(profile, "name") ?? "Organization",
        title: notification.title,
        startsAt: metadata.occurrenceStartsAt,
        href: notification.href ?? "/find",
      } satisfies PublicMapBoardAlert
    })
    .filter((alert): alert is PublicMapBoardAlert => Boolean(alert))

  const memberProfile = {
    name: profileRow?.full_name ?? user.user_metadata?.full_name?.toString?.() ?? null,
    email: user.email ?? null,
    avatarUrl: profileRow?.avatar_url ?? null,
    title: profileRow?.headline ?? null,
    company: profileRow?.company ?? null,
    contact: profileRow?.contact ?? null,
    about: profileRow?.about ?? null,
  } satisfies PublicMapMemberProfile

  const onboardingDefaults = buildOnboardingFlowDefaults({
    userId: user.id,
    email: user.email ?? null,
    displayName: memberProfile.name,
    avatarUrl: memberProfile.avatarUrl,
    userMetadata: userMeta,
    orgProfile: null,
    orgSlug: null,
  })

  return {
    viewer: { id: user.id, email: user.email ?? null },
    memberProfile,
    joinedOrganizations,
    boardAlerts,
    needsMemberOnboarding:
      !completed &&
      (intentFocus === "find" || intentFocus === "fund" || intentFocus === "support"),
    onboardingDefaults,
  }
}
