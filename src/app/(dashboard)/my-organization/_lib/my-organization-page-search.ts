import { redirect } from "next/navigation"

import { getWorkspaceDrawerPath } from "@/lib/workspace/routes"

import { resolveWorkspaceOnboardingStageFromSearchParam } from "../_components/workspace-board/workspace-board-onboarding-flow"
import type { MyOrganizationSearchParams } from "./types"

export async function resolveMyOrganizationPageSearchState(
  searchParams?: Promise<MyOrganizationSearchParams>
) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  return {
    resolvedSearchParams,
    viewParam:
      typeof resolvedSearchParams?.view === "string"
        ? resolvedSearchParams.view
        : "",
    modeParam:
      typeof resolvedSearchParams?.mode === "string"
        ? resolvedSearchParams.mode
        : "",
    tabParam:
      typeof resolvedSearchParams?.tab === "string"
        ? resolvedSearchParams.tab
        : "",
    programIdParam:
      typeof resolvedSearchParams?.programId === "string"
        ? resolvedSearchParams.programId
        : "",
    focusParam:
      typeof resolvedSearchParams?.focus === "string"
        ? resolvedSearchParams.focus
        : "",
    initialWorkspaceFocusCardId:
      resolvedSearchParams?.focus === "fiscal-sponsorship"
        ? ("fiscal-sponsorship" as const)
        : null,
    drawerParam:
      typeof resolvedSearchParams?.drawer === "string"
        ? resolvedSearchParams.drawer
        : "",
    acceleratorGroupParam:
      typeof resolvedSearchParams?.group === "string"
        ? resolvedSearchParams.group
        : null,
    acceleratorModuleParam:
      typeof resolvedSearchParams?.module === "string"
        ? resolvedSearchParams.module
        : null,
    acceleratorStepParam:
      typeof resolvedSearchParams?.step === "string"
        ? resolvedSearchParams.step
        : null,
    roadmapSectionParam:
      typeof resolvedSearchParams?.section === "string"
        ? resolvedSearchParams.section
        : null,
    monthParam:
      typeof resolvedSearchParams?.month === "string"
        ? resolvedSearchParams.month
        : "",
    onboardingFlowRequested:
      typeof resolvedSearchParams?.onboarding_flow === "string" &&
      resolvedSearchParams.onboarding_flow === "1",
    onboardingStageOverride: resolveWorkspaceOnboardingStageFromSearchParam(
      typeof resolvedSearchParams?.onboarding_stage === "string"
        ? resolvedSearchParams.onboarding_stage
        : null
    ),
  }
}

export function redirectLegacyMyOrganizationTab(tabParam: string) {
  if (tabParam === "roadmap") {
    redirect(getWorkspaceDrawerPath({ tab: "roadmap" }))
  }
  if (tabParam === "documents") {
    redirect(getWorkspaceDrawerPath({ tab: "documents" }))
  }
}
