"use client"

import { startTransition, useEffect, useMemo, useState } from "react"

import {
  normalizeWorkspaceAcceleratorCardInput,
  resolveWorkspaceAcceleratorCardTargetSize,
} from "../lib"
import type { WorkspaceAcceleratorCardInput } from "../types"

export function useWorkspaceAcceleratorCardController(input: WorkspaceAcceleratorCardInput) {
  const normalized = useMemo(() => normalizeWorkspaceAcceleratorCardInput(input), [input])
  const {
    steps,
    size,
    mode: initialMode = "setup",
    tasks = [],
    allowTaskUpdates = false,
    allowAutoResize,
    storageKey,
    onSizeChange,
    onTaskStatusToggle,
  } = normalized

  const [currentIndex, setCurrentIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)

  useEffect(() => {
    if (!storageKey) return
    const raw = window.localStorage.getItem(`workspace-accelerator-card:${storageKey}`)
    if (!raw) return
    const nextIndex = Number.parseInt(raw, 10)
    if (!Number.isFinite(nextIndex) || nextIndex < 0) return
    startTransition(() => setCurrentIndex(nextIndex))
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    const rawMode = window.localStorage.getItem(`workspace-accelerator-card:mode:${storageKey}`)
    if (rawMode !== "tasks" && rawMode !== "setup") return
    startTransition(() => setMode(rawMode))
  }, [storageKey])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (steps.length === 0) {
      setCurrentIndex(0)
      return
    }
    setCurrentIndex((previous) => Math.min(previous, steps.length - 1))
  }, [steps.length])

  const currentStep = steps[currentIndex] ?? null
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < steps.length - 1

  const goPrevious = () => {
    if (!canGoPrevious) return
    startTransition(() => setCurrentIndex((previous) => Math.max(0, previous - 1)))
  }

  const goNext = () => {
    if (!canGoNext) return
    startTransition(() => setCurrentIndex((previous) => Math.min(steps.length - 1, previous + 1)))
  }

  useEffect(() => {
    if (!allowAutoResize || !onSizeChange || !currentStep || mode !== "setup") return
    const targetSize = resolveWorkspaceAcceleratorCardTargetSize(currentStep)
    if (targetSize !== size) {
      onSizeChange(targetSize)
    }
  }, [allowAutoResize, currentStep, mode, onSizeChange, size])

  useEffect(() => {
    if (!storageKey || steps.length === 0) return
    window.localStorage.setItem(`workspace-accelerator-card:${storageKey}`, String(currentIndex))
  }, [currentIndex, steps.length, storageKey])

  useEffect(() => {
    if (!storageKey) return
    window.localStorage.setItem(`workspace-accelerator-card:mode:${storageKey}`, mode)
  }, [mode, storageKey])

  const currentModuleSteps = useMemo(() => {
    if (!currentStep) return []
    return steps.filter((step) => step.moduleId === currentStep.moduleId)
  }, [currentStep, steps])

  const currentModuleStepIndex = useMemo(() => {
    if (!currentStep) return -1
    return currentModuleSteps.findIndex((step) => step.id === currentStep.id)
  }, [currentModuleSteps, currentStep])

  return {
    steps,
    currentStep,
    currentIndex,
    mode,
    setMode,
    tasks,
    allowTaskUpdates,
    onTaskStatusToggle,
    currentModuleSteps,
    currentModuleStepIndex,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
  }
}
