"use client"

import { useEffect, useMemo, useState } from "react"

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
  const [typedMessage, setTypedMessage] = useState("")

  useEffect(() => {
    setTypedMessage("")
    let cursor = 0
    const fullMessage = step.message
    const intervalId = window.setInterval(() => {
      cursor += 1
      setTypedMessage(fullMessage.slice(0, cursor))
      if (cursor >= fullMessage.length) {
        window.clearInterval(intervalId)
      }
    }, 12)

    return () => window.clearInterval(intervalId)
  }, [step.message])

  return {
    step,
    stepCount: resolveWorkspaceCanvasTutorialStepCount(),
    continueMode,
    typedMessage,
  }
}
