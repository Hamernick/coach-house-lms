import {
  isWorkspaceFoundationRolloutEnabled,
  resolveWorkspaceFoundationLegacyDestination,
} from "@/lib/workspace/foundation-rollout"

import type { resolveMyOrganizationPageSearchState } from "./my-organization-page-search"
import { resolveInitialWorkspaceDrawerData } from "./my-organization-page-state"

export function resolveWorkspaceFoundationPageMode({
  needsInitialOnboarding,
  orgId,
  searchState,
  userId,
}: {
  needsInitialOnboarding: boolean
  orgId: string
  searchState: Awaited<ReturnType<typeof resolveMyOrganizationPageSearchState>>
  userId: string
}) {
  const {
    acceleratorGroupParam,
    acceleratorModuleParam,
    acceleratorStepParam,
    drawerParam,
    focusParam,
    programIdParam,
    roadmapSectionParam,
    tabParam,
    viewParam,
  } = searchState
  const enabled = isWorkspaceFoundationRolloutEnabled({ orgId, userId })
  const emptyDrawerData = {
    initialAcceleratorGroup: null,
    initialAcceleratorModuleId: null,
    initialAcceleratorStepId: null,
    initialDrawerTab: null,
    initialEditMode: false,
    initialFocus: null,
    initialRoadmapSectionSlug: null,
    initialProfileTab: null,
    initialProgramId: null,
  }

  return {
    enabled,
    initialDrawerData: enabled
      ? resolveInitialWorkspaceDrawerData({
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
        }).initialDrawerData
      : emptyDrawerData,
    legacyDestination: enabled
      ? null
      : resolveWorkspaceFoundationLegacyDestination({
          acceleratorGroup: acceleratorGroupParam,
          acceleratorModuleId: acceleratorModuleParam,
          acceleratorStepId: acceleratorStepParam,
          drawer: drawerParam,
          focus: focusParam,
          organizationTab: tabParam,
          programId: programIdParam,
          roadmapSection: roadmapSectionParam,
          view: viewParam,
        }),
    showLegacyEditor:
      !enabled &&
      !needsInitialOnboarding &&
      (viewParam === "editor" || Boolean(tabParam) || Boolean(programIdParam)),
  }
}
