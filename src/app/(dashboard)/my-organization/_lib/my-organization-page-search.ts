import { redirect } from "next/navigation"

import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

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
  if (tabParam === "roadmap") redirect(WORKSPACE_ROADMAP_PATH)
  if (tabParam === "documents") redirect("/organization/documents")
}
