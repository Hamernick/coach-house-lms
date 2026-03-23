"use client"

import { useMemo } from "react"

import {
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
} from "../lib"
import type { WorkspaceCanvasTutorialStepId } from "../types"

export function useWorkspaceCanvasTutorialController(
  stepIndex: number,
  openedStepIds: WorkspaceCanvasTutorialStepId[],
) {
  const step = useMemo(
    () => resolveWorkspaceCanvasTutorialStep(stepIndex),
    [stepIndex],
  )
  const continueMode = useMemo(
    () => resolveWorkspaceCanvasTutorialContinueMode(stepIndex, openedStepIds),
    [openedStepIds, stepIndex],
  )

  return {
    step,
    stepCount: resolveWorkspaceCanvasTutorialStepCount(),
    continueMode,
    message: step.message,
  }
}
