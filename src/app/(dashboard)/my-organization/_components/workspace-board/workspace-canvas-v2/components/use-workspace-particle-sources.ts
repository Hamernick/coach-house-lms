"use client"

import { useMemo } from "react"

import {
  buildWorkspaceActivityFeedFromCommunicationsOverlay,
  mergeWorkspaceActivityFeeds,
} from "../../../../_lib/workspace-activity"
import type {
  WorkspaceBoardState,
  WorkspaceSeedData,
} from "../../workspace-board-types"

export function useWorkspaceParticleSources({
  boardState,
  seed,
}: {
  boardState: WorkspaceBoardState
  seed: WorkspaceSeedData
}) {
  const organization = useMemo(
    () => ({
      id: seed.orgId,
      title: seed.organizationTitle,
      subtitle: seed.organizationSubtitle,
      logoUrl: seed.initialProfile.logoUrl,
      headerUrl: seed.initialProfile.headerUrl,
      programsCount: seed.programsCount,
      peopleCount: seed.peopleCount,
      fundingGoalCents: seed.fundingGoalCents,
      raisedCents: seed.raisedCents,
    }),
    [
      seed.fundingGoalCents,
      seed.initialProfile.headerUrl,
      seed.initialProfile.logoUrl,
      seed.orgId,
      seed.organizationSubtitle,
      seed.organizationTitle,
      seed.peopleCount,
      seed.programsCount,
      seed.raisedCents,
    ]
  )
  const activities = useMemo(
    () =>
      mergeWorkspaceActivityFeeds(
        seed.activityFeed,
        buildWorkspaceActivityFeedFromCommunicationsOverlay(
          boardState.communications.activityByDay
        )
      ),
    [boardState.communications.activityByDay, seed.activityFeed]
  )

  return { organization, activities }
}
