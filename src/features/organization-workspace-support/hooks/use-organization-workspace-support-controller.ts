"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { organizationWorkspaceSupportEnabled } from "@/lib/feature-flags"
import { leaveWorkspaceSupportPresence, syncWorkspaceSupportPresence } from "../actions"
import type { WorkspaceSupportParticipant } from "../types"

export function useOrganizationWorkspaceSupportController(organizationId: string, supportAccess: boolean) {
  const path = usePathname()
  const [participants, setParticipants] = useState<WorkspaceSupportParticipant[]>([])
  const [error, setError] = useState<string | null>(null)
  const session = useRef<string>("")
  useEffect(() => {
    if (!organizationWorkspaceSupportEnabled) return
    session.current = crypto.randomUUID()
    let stopped = false
    let busy = false
    let position: { x: number; y: number } | null = null
    let editedAt = 0
    const pointer = (event: PointerEvent) => {
      position = { x: Math.max(0, Math.min(1, event.clientX / window.innerWidth)), y: Math.max(0, Math.min(1, event.clientY / window.innerHeight)) }
    }
    const editing = () => { editedAt = Date.now() }
    const tick = async () => {
      if (busy || stopped) return
      busy = true
      try {
        const result = await syncWorkspaceSupportPresence({ organizationId, sessionId: session.current,
          path, position: document.visibilityState === "visible" ? position : null,
          editing: supportAccess && Date.now() - editedAt < 3000 })
        if (stopped) return
        if ("error" in result) { setError(result.error ?? "Live support presence is unavailable."); setParticipants([]) }
        else { setError(null); setParticipants(result.participants ?? []) }
      } catch { if (!stopped) { setError("Live support presence is reconnecting."); setParticipants([]) } }
      finally { busy = false }
    }
    if (supportAccess) {
      window.addEventListener("pointermove", pointer, { passive: true })
      window.addEventListener("input", editing, true)
    }
    void tick()
    const interval = window.setInterval(() => void tick(), 1000)
    return () => {
      stopped = true
      window.clearInterval(interval)
      window.removeEventListener("pointermove", pointer)
      window.removeEventListener("input", editing, true)
      void leaveWorkspaceSupportPresence(organizationId, session.current).catch(() => undefined)
    }
  }, [organizationId, supportAccess, path])
  return { participants, error, sessionId: session.current, path }
}
