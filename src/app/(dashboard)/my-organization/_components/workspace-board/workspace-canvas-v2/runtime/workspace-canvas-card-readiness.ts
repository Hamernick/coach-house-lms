import { resolveBrandKitReadiness } from "@/lib/organization/brand-kit-readiness"
import { resolveRoadmapSectionDerivedStatus } from "@/lib/roadmap/helpers"

import type {
  WorkspaceBoardState,
  WorkspaceSeedData,
} from "../../workspace-board-types"
import type { WorkspaceCanvasV2CardId } from "../contracts/workspace-card-contract"

export type WorkspaceCardReadinessStatus = "empty" | "partial" | "ready"

export type WorkspaceCardReadiness = {
  status: WorkspaceCardReadinessStatus
  isReady: boolean
}

function buildReadiness(status: WorkspaceCardReadinessStatus): WorkspaceCardReadiness {
  return {
    status,
    isReady: status === "ready",
  }
}

function resolveOrganizationReadiness(seed: WorkspaceSeedData) {
  if (
    seed.journeyReadiness.organizationProfileComplete &&
    seed.journeyReadiness.teammateCount >= 1
  ) {
    return buildReadiness("ready")
  }

  const hasIdentitySignal = Boolean(
    seed.initialProfile.name?.trim() ||
      seed.initialProfile.tagline?.trim() ||
      seed.initialProfile.boilerplate?.trim(),
  )

  return buildReadiness(hasIdentitySignal ? "partial" : "empty")
}

function resolveRoadmapReadiness(seed: WorkspaceSeedData) {
  const roadmapSections = seed.roadmapSections
  const roadmapSectionStatuses = roadmapSections.map((section) =>
    resolveRoadmapSectionDerivedStatus(section),
  )
  const completedCount = roadmapSectionStatuses.filter(
    (status) => status === "complete",
  ).length
  const startedCount = roadmapSectionStatuses.filter(
    (status) => status !== "not_started",
  ).length

  if (roadmapSections.length > 0 && completedCount === roadmapSections.length) {
    return buildReadiness("ready")
  }

  if (startedCount > 0) {
    return buildReadiness("partial")
  }

  const hasPlanningSignal =
    seed.programsCount > 0 ||
    Boolean(seed.calendar.nextEvent) ||
    seed.calendar.upcomingEvents.length > 0

  return buildReadiness(hasPlanningSignal ? "partial" : "empty")
}

function resolveProgramsReadiness(seed: WorkspaceSeedData) {
  return buildReadiness(seed.programsCount > 0 ? "ready" : "empty")
}

function resolveAcceleratorReadiness({
  seed,
  boardState,
}: {
  seed: WorkspaceSeedData
  boardState: WorkspaceBoardState
}) {
  const completedCount = Math.max(
    seed.journeyReadiness.acceleratorCompletedStepCount,
    boardState.accelerator.completedStepIds.length,
  )
  const started =
    seed.journeyReadiness.acceleratorStarted ||
    Boolean(boardState.accelerator.activeStepId) ||
    completedCount > 0

  return buildReadiness(started ? "ready" : "empty")
}

function resolveEconomicEngineReadiness(seed: WorkspaceSeedData) {
  const hasFundingGoal = seed.fundingGoalCents > 0
  const hasPrograms = seed.programsCount > 0

  if (hasFundingGoal && hasPrograms) {
    return buildReadiness("ready")
  }

  return buildReadiness(hasFundingGoal || hasPrograms ? "partial" : "empty")
}

function resolveCalendarReadiness(seed: WorkspaceSeedData) {
  const hasCalendarSignal =
    Boolean(seed.calendar.nextEvent) || seed.calendar.upcomingEvents.length > 0

  return buildReadiness(hasCalendarSignal ? "ready" : "empty")
}

function resolveMapReadiness(seed: WorkspaceSeedData) {
  const profile = seed.initialProfile
  const hasStorySignal = Boolean(
    profile.vision?.trim() &&
      profile.mission?.trim() &&
      profile.values?.trim(),
  )
  const hasIdentitySignal = Boolean(
    profile.name?.trim() &&
      profile.tagline?.trim() &&
      (
        profile.address?.trim() ||
        profile.addressStreet?.trim() ||
        profile.addressCity?.trim() ||
        profile.addressState?.trim() ||
        profile.addressPostal?.trim()
      ),
  )
  const hasLogoSignal = Boolean(profile.logoUrl?.trim())

  if (hasStorySignal && hasIdentitySignal && hasLogoSignal) {
    return buildReadiness("ready")
  }

  if (hasStorySignal || hasIdentitySignal || hasLogoSignal) {
    return buildReadiness("partial")
  }

  return buildReadiness("empty")
}

function resolveCommunicationsReadiness({
  seed,
  boardState,
}: {
  seed: WorkspaceSeedData
  boardState: WorkspaceBoardState
}) {
  const brandReadiness = resolveBrandKitReadiness(seed.initialProfile)
  const connectedChannelCount = Object.values(
    boardState.communications.channelConnections,
  ).filter((entry) => entry.connected).length
  const communicationsActivityCount = seed.activityFeed.filter(
    (entry) => entry.source === "communications",
  ).length

  if (
    brandReadiness.completedCount >= 2 ||
    connectedChannelCount > 0 ||
    communicationsActivityCount > 0
  ) {
    return buildReadiness("ready")
  }

  const hasBrandOrCopySignal =
    brandReadiness.completedCount > 0 ||
    Boolean(boardState.communications.copy.trim())

  return buildReadiness(hasBrandOrCopySignal ? "partial" : "empty")
}

export function resolveWorkspaceCanvasCardReadinessMap({
  seed,
  boardState,
}: {
  seed: WorkspaceSeedData
  boardState: WorkspaceBoardState
}): Record<WorkspaceCanvasV2CardId, WorkspaceCardReadiness> {
  const brandKitReadiness = resolveBrandKitReadiness(seed.initialProfile)

  return {
    "organization-overview": resolveOrganizationReadiness(seed),
    programs: resolveProgramsReadiness(seed),
    roadmap: resolveRoadmapReadiness(seed),
    deck: resolveAcceleratorReadiness({ seed, boardState }),
    accelerator: resolveAcceleratorReadiness({ seed, boardState }),
    "economic-engine": resolveEconomicEngineReadiness(seed),
    calendar: resolveCalendarReadiness(seed),
    communications: resolveCommunicationsReadiness({ seed, boardState }),
    "brand-kit": buildReadiness(
      brandKitReadiness.status === "ready"
        ? "ready"
        : brandKitReadiness.completedCount > 0
          ? "partial"
          : "empty",
    ),
    atlas: resolveMapReadiness(seed),
  }
}
