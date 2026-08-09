import { redirect } from "next/navigation"
import { loadOrganizationWorkspaceFinanceInput } from "@/actions/workspace-finance-helpers"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"
import { canEditOrganization } from "@/lib/organization/active-org"
import { measureServerStep } from "@/lib/performance/server-timing"
import type { Json } from "@/lib/supabase"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import {
  applyOrganizationSetupAcceleratorProgressOverride,
  hasSavedOrganizationSetup,
} from "@/lib/accelerator/organization-setup"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { getWorkspaceAcceleratorPaywallPath } from "@/lib/workspace/routes"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  buildWorkspaceAcceleratorCardSteps,
  type WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"
import { loadFiscalSponsorshipProjectWorkflowSummary } from "@/features/fiscal-sponsorship"
import { completeOnboardingAction } from "../../onboarding/actions"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import { buildMyOrganizationCalendarView } from "./calendar"
import { applyFormationStatusAcceleratorProgressOverrides } from "./my-organization-accelerator-progress"
import {
  buildAcceleratorTimelineModules,
  buildModuleGroupMetaById,
} from "./my-organization-accelerator-timeline"
import {
  buildAcceleratorWorkspaceSeed,
  buildMyOrganizationDerivedMetrics,
  buildWorkspaceViewer,
  fetchWorkspacePrograms,
} from "./my-organization-page-content-support"
import { mapUpcomingEvents, type UpcomingEventRow } from "./upcoming-events"
import { buildWorkspaceViewSeed } from "./workspace-view"
import {
  applyWorkspaceOnboardingStageToSeed,
  applyWorkspaceTutorialActivationToSeed,
  hydrateWorkspaceSeedAcceleratorState,
} from "./my-organization-page-content-helpers"
import { isMissingWorkspaceBoardsTableError } from "./workspace-view-helpers"
import { readWorkspaceBoardStateValue } from "./workspace-state"
import type { FormationSummary, MyOrganizationSearchParams } from "./types"
import { buildWorkspaceOrganizationEditorData } from "./workspace-organization-editor-data"
import { loadMyOrganizationProfileContext } from "./my-organization-page-profile"
import {
  redirectLegacyMyOrganizationTab,
  resolveMyOrganizationPageSearchState,
} from "./my-organization-page-search"
import {
  getOnboarding,
  resolveInitialWorkspaceDrawerData,
} from "./my-organization-page-state"
import {
  buildWorkspacePeopleData,
  loadOrganizationPeopleTaxonomy,
} from "./workspace-people-segments"

type MyOrganizationRequestContext = NonNullable<
  Awaited<ReturnType<typeof resolveOptionalAuthenticatedAppContext>>
>

type MyOrganizationSupabase = MyOrganizationRequestContext["supabase"]

function resolveFiscalApplicantPrefillIdentity({
  profileAudience,
  user,
}: {
  profileAudience: { fullName: string | null }
  user: { email?: string | null }
}) {
  return {
    applicantEmail: user.email ?? null,
    applicantFullName: profileAudience.fullName,
  }
}

async function loadMyOrganizationFiscalSponsorshipWorkflow({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: MyOrganizationSupabase
}) {
  const { data: fiscalSponsorshipProjectRow } = await supabase
    .from("organization_projects")
    .select("id")
    .eq("org_id", orgId)
    .eq("project_kind", "organization_admin")
    .maybeSingle<{ id: string }>()
  const fiscalSponsorshipProjectId = fiscalSponsorshipProjectRow?.id ?? null
  const fiscalSponsorshipWorkflowSummaryResult = fiscalSponsorshipProjectId
    ? await loadFiscalSponsorshipProjectWorkflowSummary(
        fiscalSponsorshipProjectId
      )
    : null
  const fiscalSponsorshipWorkflowSummary =
    fiscalSponsorshipWorkflowSummaryResult &&
    !("error" in fiscalSponsorshipWorkflowSummaryResult)
      ? fiscalSponsorshipWorkflowSummaryResult
      : null

  return {
    fiscalSponsorshipProjectId,
    fiscalSponsorshipWorkflowSummary,
  }
}

type SortableRoadmapModule = {
  slug: string
  title: string
  index: number
  sequence?: number
  href?: string
}

function partitionRoadmapModules<T extends SortableRoadmapModule>(
  modules: T[]
) {
  const sortedRoadmapModules = sortAcceleratorModules(modules)
  return {
    sortedRoadmapModules,
    foundationRoadmapModules: sortedRoadmapModules.filter(
      (module) => !isElectiveAddOnModule(module)
    ),
    acceleratorRoadmapModules: sortedRoadmapModules.filter((module) =>
      isElectiveAddOnModule(module)
    ),
  }
}

// eslint-disable-next-line max-lines-per-function
export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const {
    resolvedSearchParams,
    viewParam,
    modeParam,
    tabParam,
    programIdParam,
    focusParam,
    drawerParam,
    acceleratorGroupParam,
    acceleratorModuleParam,
    acceleratorStepParam,
    roadmapSectionParam,
    monthParam,
    onboardingFlowRequested,
    onboardingStageOverride,
  } = await resolveMyOrganizationPageSearchState(searchParams)
  redirectLegacyMyOrganizationTab(tabParam)
  const requestContext = await resolveOptionalAuthenticatedAppContext()
  if (!requestContext) redirect("/login?redirect=/organization")
  const { supabase, user, profileAudience, activeOrg } = requestContext
  const { orgId, role } = activeOrg
  const isAdmin = profileAudience.isAdmin
  const { userMeta, needsInitialOnboarding } = getOnboarding(requestContext)
  const canEdit = isAdmin || canEditOrganization(role)
  const acceleratorViewRequested = viewParam === "accelerator"
  const { organizationEditorRequested, initialDrawerData } =
    resolveInitialWorkspaceDrawerData({
      acceleratorGroupParam,
      acceleratorModuleParam,
      acceleratorStepParam,
      drawerParam,
      focusParam,
      needsInitialOnboarding,
      programIdParam,
      roadmapSectionParam,
      tabParam,
      viewParam,
    })
  const presentationMode =
    modeParam === "present" || modeParam === "presentation"
  const { orgRow, profile, initialProfile, roadmapSections } =
    await measureServerStep(
      "workspace.content.load_profile_context",
      () => loadMyOrganizationProfileContext({ supabase, orgId }),
      { thresholdMs: 750 }
    )
  const nowIso = new Date().toISOString()
  const [
    programsResult,
    upcomingEventsResult,
    acceleratorProgress,
    activeSubscriptionResult,
    entitlements,
    organizationPeopleTaxonomy,
  ] = await measureServerStep(
    "workspace.content.load_parallel_data",
    () =>
      Promise.all([
        fetchWorkspacePrograms({ supabase, orgId }),
        acceleratorViewRequested
          ? Promise.resolve({
              data: [] as UpcomingEventRow[],
              error: null,
            } as { data: UpcomingEventRow[]; error: null })
          : supabase
              .from("roadmap_calendar_internal_events")
              .select(
                "id,title,description,event_type,starts_at,ends_at,all_day,recurrence,status,assigned_roles,updated_at"
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
        loadOrganizationPeopleTaxonomy({ orgId, supabase }),
      ]),
    { thresholdMs: 1_000 }
  )
  const programs = programsResult
  const upcomingEvents = mapUpcomingEvents(upcomingEventsResult.data)
  const currentPlanTier = resolvePricingPlanTier(
    activeSubscriptionResult.data ?? null
  )
  const hasPaidPlan = currentPlanTier !== "free"
  const hasWorkspaceAcceleratorAccess =
    entitlements.hasAcceleratorAccess || entitlements.hasElectiveAccess
  const acceleratorProgressSummary =
    applyFormationStatusAcceleratorProgressOverrides(
      applyOrganizationSetupAcceleratorProgressOverride(
        acceleratorProgress,
        hasSavedOrganizationSetup({
          organizationName: initialProfile.name,
          publicSlug: orgRow?.public_slug,
        })
      ),
      initialProfile.formationStatus ?? null
    )
  const calendarView = buildMyOrganizationCalendarView({
    monthParam,
    searchParams: resolvedSearchParams,
    upcomingEvents,
  })
  const {
    sortedRoadmapModules,
    foundationRoadmapModules,
    acceleratorRoadmapModules,
  } = partitionRoadmapModules(
    acceleratorProgressSummary.groups.flatMap((group) => group.modules)
  )
  const { peopleNormalized, peopleSegments, peopleTags } =
    buildWorkspacePeopleData({ profile, ...organizationPeopleTaxonomy })
  const onboardingDefaults = buildOnboardingFlowDefaults({
    userId: user.id,
    email: user.email ?? null,
    displayName:
      profileAudience.fullName ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    avatarUrl:
      profileAudience.avatarUrl ??
      (typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null),
    userMetadata: userMeta,
    orgProfile: profile,
    orgSlug: orgRow?.public_slug ?? null,
    builderPlanTier: currentPlanTier,
  })
  const programRows = (programs ?? []) as Array<{
    goal_cents: number | null
    raised_cents: number | null
  }>
  const teammateCount = peopleNormalized.length
  const {
    formationSummary,
    fundingGoalCents,
    organizationProfileComplete,
    organizationSubtitle,
    organizationTitle,
    peopleCount,
    programsCount,
    raisedCents,
    workspaceDocumentCount,
  } = buildMyOrganizationDerivedMetrics({
    initialProfile,
    profile,
    programs: programRows,
    teammateCount,
    foundationRoadmapModules,
    acceleratorRoadmapModules,
  })
  const viewer = buildWorkspaceViewer(user)
  const moduleGroupMetaById = buildModuleGroupMetaById(
    acceleratorProgressSummary.groups
  )
  const acceleratorTimelineModules = await measureServerStep(
    "workspace.content.build_accelerator_timeline",
    () =>
      buildAcceleratorTimelineModules({
        supabase,
        userId: user.id,
        sortedRoadmapModules,
        groupMetaById: moduleGroupMetaById,
        onboardingDefaults,
      }),
    { thresholdMs: 750 }
  )
  const acceleratorTimeline = buildWorkspaceAcceleratorCardSteps(
    acceleratorTimelineModules
  )
  if (acceleratorViewRequested) {
    const { MyOrganizationAcceleratorView } =
      await import("../_components/workspace-board/my-organization-accelerator-view")
    if (!hasWorkspaceAcceleratorAccess) {
      redirect(getWorkspaceAcceleratorPaywallPath())
    }

    const boardResult = await supabase
      .from("organization_workspace_boards")
      .select("state")
      .eq("org_id", orgId)
      .maybeSingle<{ state: unknown }>()
    if (
      boardResult.error &&
      !isMissingWorkspaceBoardsTableError(boardResult.error)
    ) {
      throw supabaseErrorToError(
        boardResult.error,
        "Unable to load workspace board state."
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
      isPlatformAdmin: isAdmin,
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
      roadmapSections,
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

  const workspaceSeed = await measureServerStep(
    "workspace.content.build_workspace_seed",
    () =>
      buildWorkspaceViewSeed({
        supabase,
        orgId,
        role,
        canEdit,
        isPlatformAdmin: isAdmin,
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
        roadmapSections,
        formationSummary,
        acceleratorTimeline,
        calendar: calendarView,
        initialOnboarding: {
          required: needsInitialOnboarding,
          defaults: onboardingDefaults,
        },
      }),
    { thresholdMs: 1_000 }
  )

  const hydratedWorkspaceSeed = hydrateWorkspaceSeedAcceleratorState(
    workspaceSeed,
    acceleratorTimeline
  )
  const workspaceSeedForRender = applyWorkspaceOnboardingStageToSeed(
    hydratedWorkspaceSeed,
    onboardingStageOverride
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
    }
  )
  const { fiscalSponsorshipProjectId, fiscalSponsorshipWorkflowSummary } =
    await measureServerStep(
      "workspace.content.load_fiscal_workflow",
      () => loadMyOrganizationFiscalSponsorshipWorkflow({ orgId, supabase }),
      { thresholdMs: 750 }
    )

  const organizationEditorData = await measureServerStep(
    "workspace.content.build_organization_editor_data",
    () =>
      buildWorkspaceOrganizationEditorData({
        ...resolveFiscalApplicantPrefillIdentity({ profileAudience, user }),
        canAccessRoadmapDocuments: entitlements.hasAcceleratorAccess,
        canEdit,
        fiscalSponsorshipProjectId,
        fiscalSponsorshipWorkflowSummary,
        initialProfile,
        ...initialDrawerData,
        peopleNormalized,
        peopleSegments,
        peopleTags,
        profile,
        programs,
        publicSlug: orgRow?.public_slug ?? null,
        roadmapSections,
      }),
    { thresholdMs: 1_000 }
  )
  const financeInput = await loadOrganizationWorkspaceFinanceInput({
    orgId,
    programs: organizationEditorData.programs,
    supabase,
  })
  const { MyOrganizationWorkspaceView } =
    await import("../_components/workspace-board/my-organization-workspace-view")

  return (
    <MyOrganizationWorkspaceView
      seed={workspaceSeedWithTutorial}
      onInitialOnboardingSubmit={completeOnboardingAction}
      organizationEditorData={organizationEditorData}
      financeInput={financeInput}
    />
  )
}
