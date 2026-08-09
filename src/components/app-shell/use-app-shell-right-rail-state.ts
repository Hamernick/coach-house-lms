"use client"

import { useEffect, useRef, useState } from "react"

export function useAppShellRightRailState({
  hasRightRail,
  isMobile,
  autoOpenOnDesktopWhenAvailable = false,
}: {
  hasRightRail: boolean
  isMobile: boolean
  autoOpenOnDesktopWhenAvailable?: boolean
}) {
  const [rightOpen, setRightOpen] = useState(false)
  const initiallyAvailableRef = useRef(hasRightRail)
  const rightRailPreferenceRef = useRef<"open" | "closed" | null>(null)
  const wasMobileRef = useRef(isMobile)

  useEffect(() => {
    if (!initiallyAvailableRef.current || window.innerWidth < 768) return
    setRightOpen(true)
  }, [])

  useEffect(() => {
    if (!hasRightRail) {
      setRightOpen(false)
      return
    }
    if (
      !isMobile &&
      autoOpenOnDesktopWhenAvailable &&
      rightRailPreferenceRef.current === null
    ) {
      setRightOpen(true)
      return
    }
    if (!isMobile && rightRailPreferenceRef.current === "open") {
      setRightOpen(true)
    }
    if (!isMobile && rightRailPreferenceRef.current === "closed") {
      setRightOpen(false)
    }
  }, [autoOpenOnDesktopWhenAvailable, hasRightRail, isMobile])

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
