"use client"

import { useCallback, useEffect, useState } from "react"

import {
  readWorkspaceBoardUiPreferences,
  type WorkspaceBoardUiPreferenceScope,
} from "../../workspace-board-ui-preferences"
import type { WorkspaceCanvasPersonPlacement } from "./workspace-canvas-person-node-model"
import { resolveWorkspaceCanvasPersonPlacements } from "./workspace-canvas-people-rollout"

export function useStoredWorkspacePersonPlacements({
  enabled,
  uiPreferencesScope,
}: {
  enabled: boolean
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
}) {
  const readPlacements = useCallback(
    () =>
      resolveWorkspaceCanvasPersonPlacements({
        enabled,
        placements:
          readWorkspaceBoardUiPreferences(uiPreferencesScope)
            .workspacePersonPlacements,
      }),
    [enabled, uiPreferencesScope]
  )
  const [placements, setPlacements] =
    useState<WorkspaceCanvasPersonPlacement[]>(readPlacements)

  useEffect(() => {
    setPlacements(readPlacements())
  }, [readPlacements])

  return [
    resolveWorkspaceCanvasPersonPlacements({ enabled, placements }),
    setPlacements,
  ] as const
}
