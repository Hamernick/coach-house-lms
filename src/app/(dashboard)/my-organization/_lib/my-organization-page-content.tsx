import { redirect } from "next/navigation"
import type { OrgPerson } from "@/actions/people"
import type { OrgProgram, ProfileTab } from "@/components/organization/org-profile-card/types"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { normalizePersonCategory } from "@/lib/people/categories"
import { resolvePeopleDisplayImages } from "@/lib/people/display-images"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  buildWorkspaceAcceleratorCardSteps,
  normalizeWorkspaceAcceleratorResources,
} from "@/features/workspace-accelerator-card/lib"
import type { WorkspaceAcceleratorTimelineModuleSeed } from "@/features/workspace-accelerator-card/types"
import {
  MyOrganizationEditorView,
  MyOrganizationWorkspaceView,
} from "../_components"
import { buildMyOrganizationCalendarView } from "./calendar"
import { buildInitialOrganizationProfile } from "./helpers"
import { mapUpcomingEvents, type UpcomingEventRow } from "./upcoming-events"
import { buildWorkspaceViewSeed } from "./workspace-view"
import type { MyOrganizationSearchParams } from "./types"

function isIgnorableModuleSeedError(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  return code === "42P01" || code === "42703" || code === "42501"
}

export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const viewParam = typeof resolvedSearchParams?.view === "string" ? resolvedSearchParams.view : ""
  const modeParam = typeof resolvedSearchParams?.mode === "string" ? resolvedSearchParams.mode : ""
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : ""
  const programIdParam = typeof resolvedSearchParams?.programId === "string" ? resolvedSearchParams.programId : ""
  const monthParam = typeof resolvedSearchParams?.month === "string" ? resolvedSearchParams.month : ""
  if (tabParam === "roadmap") redirect("/roadmap")
  if (tabParam === "documents") redirect("/organization/documents")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/organization")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)
  const acceleratorOverlayEnabled =
    typeof user.user_metadata?.accelerator_overlay_enabled === "boolean"
      ? user.user_metadata.accelerator_overlay_enabled
      : true
  const showEditor = viewParam === "editor" || Boolean(tabParam) || Boolean(programIdParam)
  const presentationMode = modeParam === "present" || modeParam === "presentation"

  // Load organization profile for the current user
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile, public_slug, is_public")
    .eq("user_id", orgId)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  const nowIso = new Date().toISOString()

  const [programsResult, upcomingEventsResult, acceleratorProgress, activeSubscriptionResult] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id, title, subtitle, description, location, location_type, location_url, team_ids, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url, wizard_snapshot",
      )
      .eq("user_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("roadmap_calendar_internal_events")
      .select(
        "id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles",
      )
      .eq("org_id", orgId)
      .gte("starts_at", nowIso)
      .eq("status", "active")
      .order("starts_at", { ascending: true })
      .limit(5)
      .returns<UpcomingEventRow[]>(),
    fetchAcceleratorProgressSummary({
      supabase,
      userId: user.id,
      isAdmin: false,
      basePath: "/accelerator",
    }),
    supabase
      .from("subscriptions")
      .select("status, metadata")
      .eq("user_id", orgId)
      .in("status", ["active", "trialing", "past_due", "incomplete"])
      .not("stripe_subscription_id", "ilike", "stub_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string | null; metadata: Json | null }>(),
  ])
  const programs = programsResult.data
  const upcomingEvents = mapUpcomingEvents(upcomingEventsResult.data)
  const currentPlanTier = resolvePricingPlanTier(activeSubscriptionResult.data ?? null)
  const hasPaidPlan = currentPlanTier !== "free"

  const calendarView = buildMyOrganizationCalendarView({
    monthParam,
    searchParams: resolvedSearchParams,
    upcomingEvents,
  })

  const sortedRoadmapModules = sortAcceleratorModules(
    acceleratorProgress.groups.flatMap((group) => group.modules),
  )
  const foundationRoadmapModules = sortedRoadmapModules.filter((module) => !isElectiveAddOnModule(module))
  const acceleratorRoadmapModules = sortedRoadmapModules.filter((module) => isElectiveAddOnModule(module))
  const formationTrackedModules = foundationRoadmapModules
  const formationCompletedCount = formationTrackedModules.filter((module) => module.status === "completed").length
  const formationProgressPercent =
    formationTrackedModules.length > 0
      ? Math.round((formationCompletedCount / formationTrackedModules.length) * 100)
      : 0
  const nextFormationModule =
    foundationRoadmapModules.find((module) => module.status !== "completed") ??
    foundationRoadmapModules[0] ??
    null
  const nextFormationHref = nextFormationModule?.href ?? "/accelerator"

  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  const peopleNormalized = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))
  const people = await resolvePeopleDisplayImages(peopleNormalized)

  const initialProfile = buildInitialOrganizationProfile({ profile, organization: orgRow ?? null })

  const allowedTabs: ProfileTab[] = ["company", "programs", "people"]
  const initialTab = allowedTabs.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : undefined
  const programRows = (programs ?? []) as Array<{
    goal_cents: number | null
    raised_cents: number | null
  }>
  const programsCount = programRows.length
  const fundingGoalCents = programRows.reduce((sum, program) => sum + (program.goal_cents ?? 0), 0)
  const raisedCents = programRows.reduce((sum, program) => sum + (program.raised_cents ?? 0), 0)
  const peopleCount = Math.max(1, people.length)
  const organizationTitle = (initialProfile.name ?? "").trim() || "Organization"
  const locationSubtitle = [(initialProfile.addressCity ?? "").trim(), (initialProfile.addressState ?? "").trim()]
    .filter(Boolean)
    .join(", ")
  const organizationSubtitle = (initialProfile.tagline ?? "").trim() || locationSubtitle || ""

  if (showEditor) {
    return (
      <MyOrganizationEditorView
        initialProfile={initialProfile}
        people={people}
        programs={programs ?? []}
        initialTab={initialTab}
        initialProgramId={programIdParam || null}
        canEdit={canEdit}
      />
    )
  }

  const formationSummary = {
    visibleModules: formationTrackedModules,
    acceleratorModules: acceleratorRoadmapModules,
    completedCount: formationCompletedCount,
    progressPercent: formationProgressPercent,
    nextHref: nextFormationHref,
  }

  const moduleGroupTitleById = new Map<string, string>()
  for (const group of acceleratorProgress.groups) {
    for (const groupModule of group.modules) {
      moduleGroupTitleById.set(groupModule.id, group.title)
    }
  }
  const timelineModuleIds = sortedRoadmapModules.map((roadmapModule) => roadmapModule.id)

  const [timelineContentResult, timelineAssignmentsResult, timelineModulesResult] =
    timelineModuleIds.length > 0
      ? await Promise.all([
          supabase
            .from("module_content")
            .select("module_id, video_url, resources")
            .in("module_id", timelineModuleIds)
            .returns<Array<{ module_id: string; video_url: string | null; resources: unknown }>>(),
          supabase
            .from("module_assignments")
            .select("module_id")
            .in("module_id", timelineModuleIds)
            .returns<Array<{ module_id: string }>>(),
          supabase
            .from("modules")
            .select("id, video_url, duration_minutes, deck_path")
            .in("id", timelineModuleIds)
            .returns<
              Array<{
                id: string
                video_url: string | null
                duration_minutes: number | null
                deck_path: string | null
              }>
            >(),
        ])
      : [
          { data: [] as Array<{ module_id: string; video_url: string | null; resources: unknown }>, error: null },
          { data: [] as Array<{ module_id: string }>, error: null },
          {
            data: [] as Array<{
              id: string
              video_url: string | null
              duration_minutes: number | null
              deck_path: string | null
            }>,
            error: null,
          },
        ]

  if (timelineContentResult.error && !isIgnorableModuleSeedError(timelineContentResult.error)) {
    console.error("[my-organization] Unable to load accelerator timeline content.", timelineContentResult.error)
  }
  if (timelineAssignmentsResult.error && !isIgnorableModuleSeedError(timelineAssignmentsResult.error)) {
    console.error("[my-organization] Unable to load accelerator timeline assignments.", timelineAssignmentsResult.error)
  }
  if (timelineModulesResult.error && !isIgnorableModuleSeedError(timelineModulesResult.error)) {
    console.error("[my-organization] Unable to load accelerator timeline module metadata.", timelineModulesResult.error)
  }

  const contentByModuleId = new Map<string, { videoUrl: string | null; resources: unknown }>()
  for (const row of timelineContentResult.data ?? []) {
    contentByModuleId.set(row.module_id, {
      videoUrl: row.video_url ?? null,
      resources: row.resources,
    })
  }
  const moduleMetaById = new Map<string, { videoUrl: string | null; durationMinutes: number | null; hasDeck: boolean }>()
  for (const row of timelineModulesResult.data ?? []) {
    moduleMetaById.set(row.id, {
      videoUrl: row.video_url ?? null,
      durationMinutes: typeof row.duration_minutes === "number" ? row.duration_minutes : null,
      hasDeck: Boolean(row.deck_path),
    })
  }
  const modulesWithAssignments = new Set((timelineAssignmentsResult.data ?? []).map((row) => row.module_id))

  const acceleratorTimelineModules: WorkspaceAcceleratorTimelineModuleSeed[] = sortedRoadmapModules.map((roadmapModule) => {
    const content = contentByModuleId.get(roadmapModule.id)
    const meta = moduleMetaById.get(roadmapModule.id)
    const resources = normalizeWorkspaceAcceleratorResources(content?.resources ?? [])
    const videoUrl = content?.videoUrl ?? meta?.videoUrl ?? null

    return {
      id: roadmapModule.id,
      title: roadmapModule.title,
      description: roadmapModule.description ?? null,
      href: roadmapModule.href,
      status: roadmapModule.status,
      groupTitle: moduleGroupTitleById.get(roadmapModule.id) ?? "Accelerator",
      videoUrl,
      durationMinutes: meta?.durationMinutes ?? null,
      resources,
      hasAssignment: modulesWithAssignments.has(roadmapModule.id),
      hasDeck: Boolean(meta?.hasDeck),
    }
  })
  const acceleratorTimeline = buildWorkspaceAcceleratorCardSteps(acceleratorTimelineModules)

  const workspaceSeed = await buildWorkspaceViewSeed({
    supabase,
    orgId,
    role,
    canEdit,
    acceleratorOverlayEnabled,
    presentationMode,
    viewer: {
      id: user.id,
      email: user.email ?? null,
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      avatarUrl: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    },
    organizationTitle,
    organizationSubtitle,
    fundingGoalCents,
    raisedCents,
    programsCount,
    peopleCount,
    initialProfile,
    formationSummary,
    acceleratorTimeline,
    calendar: calendarView,
  })

  return (
    <MyOrganizationWorkspaceView
      seed={workspaceSeed}
      organizationEditorData={{
        initialProfile,
        people,
        programs: (programs ?? []) as OrgProgram[],
        canEdit,
      }}
    />
  )
}
