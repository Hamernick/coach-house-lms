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
  MyOrganizationAcceleratorView,
  MyOrganizationEditorView,
  MyOrganizationWorkspaceView,
} from "../_components"
import { completeOnboardingAction } from "../../onboarding/actions"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import {
  resolveWorkspaceOnboardingStageFromSearchParam,
} from "../_components/workspace-board/workspace-board-onboarding-flow"
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
import {
  canInviteWorkspaceCollaborators,
  readWorkspaceBoardStateValue,
} from "./workspace-state"
import type { FormationSummary, MyOrganizationSearchParams } from "./types"

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

function buildAcceleratorWorkspaceSeed({
  orgId,
  viewer,
  profileAudience,
  presentationMode,
  role,
  canEdit,
  hasWorkspaceAcceleratorAccess,
  organizationTitle,
  organizationSubtitle,
  fundingGoalCents,
  raisedCents,
  programsCount,
  peopleCount,
  organizationProfileComplete,
  teammateCount,
  workspaceDocumentCount,
  initialProfile,
  formationSummary,
  acceleratorTimeline,
  calendarView,
  needsInitialOnboarding,
  onboardingDefaults,
  boardState,
}: {
  orgId: string
  viewer: {
    id: string
    email: string | null
    fullName: string | null
    avatarUrl: string | null
  }
  profileAudience: {
    fullName: string | null
    avatarUrl: string | null
  }
  presentationMode: boolean
  role: Awaited<ReturnType<typeof resolveActiveOrganization>>["role"]
  canEdit: boolean
  hasWorkspaceAcceleratorAccess: boolean
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  raisedCents: number
  programsCount: number
  peopleCount: number
  organizationProfileComplete: boolean
  teammateCount: number
  workspaceDocumentCount: number
  initialProfile: ReturnType<typeof buildInitialOrganizationProfile>
  formationSummary: FormationSummary
  acceleratorTimeline: WorkspaceAcceleratorCardStep[]
  calendarView: ReturnType<typeof buildMyOrganizationCalendarView>
  needsInitialOnboarding: boolean
  onboardingDefaults: ReturnType<typeof buildOnboardingFlowDefaults>
  boardState: ReturnType<typeof readWorkspaceBoardStateValue>
}) {
  return hydrateWorkspaceSeedAcceleratorState(
    {
      orgId,
      viewerId: viewer.id,
      viewerName:
        profileAudience.fullName ??
        viewer.fullName ??
        viewer.email ??
        "Teammate",
      viewerAvatarUrl: profileAudience.avatarUrl ?? viewer.avatarUrl ?? null,
      presentationMode,
      role,
      canEdit,
      canInviteCollaborators: canInviteWorkspaceCollaborators(role),
      hasAcceleratorAccess: hasWorkspaceAcceleratorAccess,
      organizationTitle,
      organizationSubtitle,
      fundingGoalCents,
      raisedCents,
      programsCount,
      peopleCount,
      journeyReadiness: {
        organizationProfileComplete,
        teammateCount,
        workspaceDocumentCount,
        acceleratorStarted: acceleratorTimeline.some(
          (step) => step.status !== "not_started",
        ),
        acceleratorCompletedStepCount: acceleratorTimeline.filter(
          (step) => step.status === "completed",
        ).length,
      },
      initialProfile,
      formationSummary,
      acceleratorTimeline,
      activityFeed: [],
      calendar: calendarView,
      collaborationInvites: [],
      members: [
        {
          userId: viewer.id,
          name: profileAudience.fullName ?? viewer.fullName ?? null,
          email: viewer.email,
          avatarUrl: profileAudience.avatarUrl ?? viewer.avatarUrl ?? null,
          role,
          isOwner: viewer.id === orgId,
        },
      ],
      boardState,
      initialOnboarding: {
        required: needsInitialOnboarding,
        defaults: onboardingDefaults,
      },
    },
    acceleratorTimeline,
  )
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
  const acceleratorGroupParam = typeof resolvedSearchParams?.group === "string" ? resolvedSearchParams.group : null
  const acceleratorModuleParam = typeof resolvedSearchParams?.module === "string" ? resolvedSearchParams.module : null
  const acceleratorStepParam = typeof resolvedSearchParams?.step === "string" ? resolvedSearchParams.step : null
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
  const acceleratorViewRequested = viewParam === "accelerator"
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
    acceleratorViewRequested
      ? Promise.resolve({
          data: [] as UpcomingEventRow[],
          error: null,
        } as { data: UpcomingEventRow[]; error: null })
      : supabase
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
      isAdmin,
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
      isAdmin,
    }),
  ])
  const programs = programsResult
  const upcomingEvents = mapUpcomingEvents(upcomingEventsResult.data)
  const currentPlanTier = resolvePricingPlanTier(activeSubscriptionResult.data ?? null)
  const hasPaidPlan = currentPlanTier !== "free"
  const hasWorkspaceAcceleratorAccess =
    entitlements.hasAcceleratorAccess || entitlements.hasElectiveAccess
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
  const nextFormationModule = foundationRoadmapModules.find((module) => module.status !== "completed") ?? foundationRoadmapModules[0] ?? null
  const nextFormationHref = nextFormationModule?.href ?? "/accelerator"
  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  const peopleNormalized = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))
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
  const teammateCount = peopleNormalized.length
  const peopleCount = Math.max(1, peopleNormalized.length)
  const organizationTitle = (initialProfile.name ?? "").trim() || "Organization"
  const locationSubtitle = [(initialProfile.addressCity ?? "").trim(), (initialProfile.addressState ?? "").trim()].filter(Boolean).join(", ")
  const organizationSubtitle = (initialProfile.tagline ?? "").trim() || locationSubtitle || ""
  const viewer = {
    id: user.id,
    email: user.email ?? null,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
  }
  if (showEditor) {
    const people = await resolvePeopleDisplayImages(peopleNormalized)
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
    onboardingDefaults,
  })
  const acceleratorTimeline = buildWorkspaceAcceleratorCardSteps(acceleratorTimelineModules)
  if (acceleratorViewRequested) {
    if (!hasWorkspaceAcceleratorAccess) {
      redirect(
        "/workspace?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator",
      )
    }

    const boardResult = await supabase
      .from("organization_workspace_boards")
      .select("state")
      .eq("org_id", orgId)
      .maybeSingle<{ state: unknown }>()
    if (boardResult.error) {
      throw supabaseErrorToError(
        boardResult.error,
        "Unable to load workspace board state.",
      )
    }
    const acceleratorSeed = buildAcceleratorWorkspaceSeed({
      orgId,
      viewer,
      profileAudience: {
        fullName: profileAudience.fullName,
        avatarUrl: profileAudience.avatarUrl,
      },
      presentationMode,
      role,
      canEdit,
      hasWorkspaceAcceleratorAccess,
      organizationTitle,
      organizationSubtitle,
      fundingGoalCents,
      raisedCents,
      programsCount,
      peopleCount,
      organizationProfileComplete,
      teammateCount,
      workspaceDocumentCount,
      initialProfile,
      formationSummary,
      acceleratorTimeline,
      calendarView,
      needsInitialOnboarding,
      onboardingDefaults,
      boardState: readWorkspaceBoardStateValue(boardResult.data?.state),
    })

    return (
      <MyOrganizationAcceleratorView
        seed={acceleratorSeed}
        initialStepId={acceleratorStepParam}
        initialModuleId={acceleratorModuleParam}
        initialLessonGroupKey={acceleratorGroupParam}
        programFundingTargets={programRows}
        onWorkspaceOnboardingSubmit={completeOnboardingAction}
      />
    )
  }

  const workspaceSeed = await buildWorkspaceViewSeed({
    supabase,
    orgId,
    role,
    canEdit,
    hasAcceleratorAccess: hasWorkspaceAcceleratorAccess,
    presentationMode,
    viewer,
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
  const people = await resolvePeopleDisplayImages(peopleNormalized)

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
