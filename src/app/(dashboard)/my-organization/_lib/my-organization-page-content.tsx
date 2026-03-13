import { redirect } from "next/navigation"
import type { OrgPerson } from "@/actions/people"
import type { OrgProgram, ProfileTab } from "@/components/organization/org-profile-card/types"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { resolveProfileAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { normalizePersonCategory } from "@/lib/people/categories"
import { resolvePeopleDisplayImages } from "@/lib/people/display-images"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  buildWorkspaceAcceleratorCardSteps,
  type WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"
import {
  MyOrganizationEditorView,
  MyOrganizationWorkspaceView,
} from "../_components"
import { completeOnboardingAction } from "../../onboarding/actions"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import {
  applyWorkspaceOnboardingStageOverride,
  resolveWorkspaceOnboardingStageFromSearchParam,
} from "../_components/workspace-board/workspace-board-onboarding-flow"
import type { WorkspaceBoardState } from "../_components/workspace-board/workspace-board-types"
import { buildMyOrganizationCalendarView } from "./calendar"
import { buildInitialOrganizationProfile } from "./helpers"
import { applyFormationStatusAcceleratorProgressOverrides } from "./my-organization-accelerator-progress"
import {
  buildAcceleratorTimelineModules,
  buildModuleGroupMetaById,
} from "./my-organization-accelerator-timeline"
import { mapUpcomingEvents, type UpcomingEventRow } from "./upcoming-events"
import { buildWorkspaceViewSeed } from "./workspace-view"
import {
  applyWorkspaceOnboardingStageToSeed,
  applyWorkspaceTutorialActivationToSeed,
  countWorkspaceDocuments,
  hydrateWorkspaceSeedAcceleratorState,
  resolveOrganizationProfileComplete,
} from "./my-organization-page-content-helpers"
import type { MyOrganizationSearchParams } from "./types"

const WORKSPACE_PROGRAM_SELECT = [
  "id",
  "title",
  "subtitle",
  "description",
  "location",
  "location_type",
  "location_url",
  "team_ids",
  "image_url",
  "duration_label",
  "features",
  "status_label",
  "goal_cents",
  "raised_cents",
  "is_public",
  "created_at",
  "start_date",
  "end_date",
  "address_city",
  "address_state",
  "address_country",
  "cta_label",
  "cta_url",
  "wizard_snapshot",
].join(", ")

const WORKSPACE_PROGRAM_LEGACY_SELECT = [
  "id",
  "title",
  "subtitle",
  "location",
  "image_url",
  "duration_label",
  "features",
  "status_label",
  "goal_cents",
  "raised_cents",
  "is_public",
  "created_at",
  "start_date",
  "end_date",
].join(", ")

async function fetchWorkspacePrograms({
  supabase,
  orgId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
}) {
  const primaryResult = await supabase
    .from("programs")
    .select(WORKSPACE_PROGRAM_SELECT)
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  if (!primaryResult.error) {
    return (primaryResult.data ?? []) as OrgProgram[]
  }

  const legacyResult = await supabase
    .from("programs")
    .select(WORKSPACE_PROGRAM_LEGACY_SELECT)
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  if (legacyResult.error) {
    console.error("workspace programs query failed", {
      orgId,
      primaryMessage: primaryResult.error.message,
      legacyMessage: legacyResult.error.message,
    })
    return []
  }

  return ((legacyResult.data ?? []) as OrgProgram[]).map((program) => ({
    ...program,
    wizard_snapshot: null,
  }))
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
  const onboardingFlowRequested =
    typeof resolvedSearchParams?.onboarding_flow === "string" &&
    resolvedSearchParams.onboarding_flow === "1"
  const onboardingStageOverride = resolveWorkspaceOnboardingStageFromSearchParam(
    typeof resolvedSearchParams?.onboarding_stage === "string" ? resolvedSearchParams.onboarding_stage : null,
  )
  if (tabParam === "roadmap") redirect("/workspace/roadmap")
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
  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const fallbackIsTester = resolveTesterMetadata(userMeta)
  const profileAudience = await resolveProfileAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })
  const isAdmin = profileAudience.isAdmin
  const needsInitialOnboarding =
    !isAdmin && !Boolean(userMeta?.onboarding_completed) && orgId === user.id
  const canEdit = canEditOrganization(role)
  const showEditor =
    !needsInitialOnboarding &&
    (viewParam === "editor" || Boolean(tabParam) || Boolean(programIdParam))
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
  const initialProfile = buildInitialOrganizationProfile({
    profile,
    organization: orgRow ?? null,
  })
  const nowIso = new Date().toISOString()
  const [programsResult, upcomingEventsResult, acceleratorProgress, activeSubscriptionResult, entitlements] = await Promise.all([
    fetchWorkspacePrograms({ supabase, orgId }),
    supabase
      .from("roadmap_calendar_internal_events")
      .select(
        "id,title,description,event_type,starts_at,ends_at,all_day,recurrence,status,assigned_roles",
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
    fetchLearningEntitlements({
      supabase,
      userId: user.id,
      orgUserId: orgId,
      isAdmin: false,
    }),
  ])
  const programs = programsResult
  const upcomingEvents = mapUpcomingEvents(upcomingEventsResult.data)
  const currentPlanTier = resolvePricingPlanTier(activeSubscriptionResult.data ?? null)
  const hasPaidPlan = currentPlanTier !== "free"
  const acceleratorProgressSummary =
    applyFormationStatusAcceleratorProgressOverrides(
      acceleratorProgress,
      initialProfile.formationStatus ?? null,
    )

  const calendarView = buildMyOrganizationCalendarView({
    monthParam,
    searchParams: resolvedSearchParams,
    upcomingEvents,
  })

  const sortedRoadmapModules = sortAcceleratorModules(
    acceleratorProgressSummary.groups.flatMap((group) => group.modules),
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

  const organizationProfileComplete = resolveOrganizationProfileComplete(initialProfile)
  const workspaceDocumentCount = countWorkspaceDocuments(profile)
  const onboardingDefaults = buildOnboardingFlowDefaults({
    userId: user.id,
    email: user.email ?? null,
    displayName:
      profileAudience.fullName ??
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
    avatarUrl:
      profileAudience.avatarUrl ??
      (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null),
    userMetadata: userMeta,
    orgProfile: profile,
    orgSlug: orgRow?.public_slug ?? null,
    builderPlanTier: currentPlanTier,
  })

  const allowedTabs: ProfileTab[] = ["company", "programs", "people"]
  const initialTab = allowedTabs.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : undefined
  const programRows = (programs ?? []) as Array<{
    goal_cents: number | null
    raised_cents: number | null
  }>
  const programsCount = programRows.length
  const fundingGoalCents = programRows.reduce((sum, program) => sum + (program.goal_cents ?? 0), 0)
  const raisedCents = programRows.reduce((sum, program) => sum + (program.raised_cents ?? 0), 0)
  const teammateCount = people.length
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

  const moduleGroupMetaById = buildModuleGroupMetaById(
    acceleratorProgressSummary.groups,
  )
  const acceleratorTimelineModules = await buildAcceleratorTimelineModules({
    supabase,
    userId: user.id,
    sortedRoadmapModules,
    groupMetaById: moduleGroupMetaById,
  })
  const acceleratorTimeline = buildWorkspaceAcceleratorCardSteps(acceleratorTimelineModules)

  const workspaceSeed = await buildWorkspaceViewSeed({
    supabase,
    orgId,
    role,
    canEdit,
    hasAcceleratorAccess: entitlements.hasAcceleratorAccess || entitlements.hasElectiveAccess,
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
    teammateCount,
    organizationProfileComplete,
    workspaceDocumentCount,
    initialProfile,
    formationSummary,
    acceleratorTimeline,
    calendar: calendarView,
    initialOnboarding: {
      required: needsInitialOnboarding,
      defaults: onboardingDefaults,
    },
  })

  const hydratedWorkspaceSeed = hydrateWorkspaceSeedAcceleratorState(
    workspaceSeed,
    acceleratorTimeline,
  )
  const workspaceSeedForRender = applyWorkspaceOnboardingStageToSeed(
    hydratedWorkspaceSeed,
    onboardingStageOverride,
  )
  const workspaceSeedWithTutorial = applyWorkspaceTutorialActivationToSeed(
    workspaceSeedForRender,
    {
      initialOnboardingRequired: needsInitialOnboarding,
      workspaceOnboardingActive: userMeta?.workspace_onboarding_active === true,
      workspaceTutorialRequested:
        onboardingFlowRequested || onboardingStageOverride !== null,
      workspaceOnboardingCompletedAt:
        typeof userMeta?.workspace_onboarding_completed_at === "string"
          ? userMeta.workspace_onboarding_completed_at
          : null,
    },
  )

  return (
    <MyOrganizationWorkspaceView
      seed={workspaceSeedWithTutorial}
      onInitialOnboardingSubmit={completeOnboardingAction}
      organizationEditorData={{
        initialProfile,
        people,
        programs: (programs ?? []) as OrgProgram[],
        canEdit,
      }}
    />
  )
}
