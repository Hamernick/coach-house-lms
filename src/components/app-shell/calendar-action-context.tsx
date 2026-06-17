"use client"

import { useEffect, useSyncExternalStore } from "react"

type AppShellCalendarTutorialCallout = {
  title: string
  instruction: string
} | null

type AppShellCalendarTutorialRegistration = {
  tutorialCalendarButtonCallout: AppShellCalendarTutorialCallout
  onTutorialCalendarButtonComplete?: (() => void) | undefined
}

const EMPTY_CALENDAR_TUTORIAL: AppShellCalendarTutorialRegistration = {
  tutorialCalendarButtonCallout: null,
  onTutorialCalendarButtonComplete: undefined,
}

let currentRegistration: AppShellCalendarTutorialRegistration =
  EMPTY_CALENDAR_TUTORIAL
const listeners = new Set<() => void>()

function emitCalendarTutorialRegistration(
  next: AppShellCalendarTutorialRegistration | null
) {
  currentRegistration = next ?? EMPTY_CALENDAR_TUTORIAL
  listeners.forEach((listener) => listener())
}

function subscribeCalendarTutorial(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getCalendarTutorialSnapshot() {
  return currentRegistration
}

export function useAppShellCalendarActionRegistration() {
  return useSyncExternalStore(
    subscribeCalendarTutorial,
    getCalendarTutorialSnapshot,
    getCalendarTutorialSnapshot
  )
}

export function useRegisterAppShellCalendarTutorial({
  tutorialCalendarButtonCallout,
  onTutorialCalendarButtonComplete,
}: AppShellCalendarTutorialRegistration) {
  useEffect(() => {
    emitCalendarTutorialRegistration({
      tutorialCalendarButtonCallout,
      onTutorialCalendarButtonComplete,
    })

    return () => {
      emitCalendarTutorialRegistration(null)
    }
  }, [onTutorialCalendarButtonComplete, tutorialCalendarButtonCallout])
}
