"use client"

import { useEffect, useState } from "react"

export function useAppShellForcedOnboarding(welcomeParam: string | null) {
  const [forcedOnboardingOpen, setForcedOnboardingOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = () => setForcedOnboardingOpen(true)
    window.addEventListener("coachhouse:onboarding:start", handler)
    return () => window.removeEventListener("coachhouse:onboarding:start", handler)
  }, [])

  useEffect(() => {
    if (welcomeParam === "1") {
      setForcedOnboardingOpen(false)
    }
  }, [welcomeParam])

  return forcedOnboardingOpen
}
