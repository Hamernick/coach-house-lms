"use client"

import { useEffect, useRef, useState } from "react"

import type { SidebarClass } from "@/lib/academy"

import { computeActiveOpenMap } from "./nav-data"

const STORAGE_KEY = "academyOpenMap"

export function useSidebarOpenMap(pathname: string, classes?: SidebarClass[] | null) {
  const activeOpenMap = computeActiveOpenMap(pathname, classes)
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(activeOpenMap)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) {
      return
    }
    initialized.current = true

    if (typeof window === "undefined") return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved) as Record<string, boolean>
      setOpenMap((prev) => mergeOpenMap(prev, parsed, activeOpenMap))
    } catch {
      // ignore parse errors
    }
  }, [activeOpenMap])

  useEffect(() => {
    setOpenMap((prev) => mergeOpenMap(prev, {}, activeOpenMap))
  }, [activeOpenMap])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openMap))
    } catch {
      // ignore write errors
    }
  }, [openMap])

  return { openMap, setOpenMap }
}

function mergeOpenMap(
  previous: Record<string, boolean>,
  saved: Record<string, boolean>,
  active: Record<string, boolean>,
) {
  let changed = false
  const next = { ...previous }

  for (const [key, value] of Object.entries(saved)) {
    if (typeof value === "boolean" && next[key] !== value) {
      next[key] = value
      changed = true
    }
  }

  for (const [slug, shouldOpen] of Object.entries(active)) {
    if (shouldOpen && !next[slug]) {
      next[slug] = true
      changed = true
    }
  }

  return changed ? next : previous
}
