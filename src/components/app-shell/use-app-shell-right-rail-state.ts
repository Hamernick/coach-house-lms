"use client"

import { useEffect, useRef, useState } from "react"

export function useAppShellRightRailState({
  hasRightRail,
  isMobile,
}: {
  hasRightRail: boolean
  isMobile: boolean
}) {
  const [rightOpen, setRightOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth >= 768
  })
  const rightRailPreferenceRef = useRef<"open" | "closed" | null>(null)
  const wasMobileRef = useRef(isMobile)

  useEffect(() => {
    if (!hasRightRail) {
      setRightOpen(false)
      return
    }
    // Avoid "late pop-open" when right-rail content mounts after page paint.
    // If the user hasn't set a preference yet, keep the current state.
    if (!isMobile && rightRailPreferenceRef.current === "open") {
      setRightOpen(true)
    }
    if (!isMobile && rightRailPreferenceRef.current === "closed") {
      setRightOpen(false)
    }
  }, [hasRightRail, isMobile])

  useEffect(() => {
    if (isMobile && !wasMobileRef.current) {
      setRightOpen(false)
    }
    wasMobileRef.current = isMobile
  }, [isMobile])

  const handleRightOpenChange = (open: boolean, source: "user" | "auto" = "user") => {
    if (source === "user") {
      rightRailPreferenceRef.current = open ? "open" : "closed"
    }
    setRightOpen(open)
  }

  return {
    rightOpen,
    handleRightOpenChangeUser: (open: boolean) => handleRightOpenChange(open, "user"),
    handleRightOpenChangeAuto: (open: boolean) => handleRightOpenChange(open, "auto"),
  }
}
