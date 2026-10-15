"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { organizationWorkspaceSupportEnabled } from "@/lib/feature-flags"
import { workspacePresenceOverHttp } from "../lib/presence-transport"
import type { WorkspaceSupportParticipant } from "../types"

export function useOrganizationWorkspaceSupportController(organizationId: string, supportAccess: boolean) {
  const path = usePathname()
  const [participants, setParticipants] = useState<WorkspaceSupportParticipant[]>([])
  const [error, setError] = useState<string | null>(null)
  const session = useRef<string>("")
  useEffect(() => {
    if (!organizationWorkspaceSupportEnabled) return
    session.current = crypto.randomUUID()
    const lifetime = new AbortController()
    let interval: ReturnType<typeof setTimeout>
    let failures = 0
    const sessionId = session.current
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
        const result = await workspacePresenceOverHttp({ organizationId, sessionId,
          path, position: document.visibilityState === "visible" ? position : null,
          editing: supportAccess && Date.now() - editedAt < 3000 }, lifetime.signal)
        if (stopped) return
        if ("error" in result) { failures++; setError(result.error ?? "Live support presence is unavailable."); setParticipants([]) }
        else { failures = 0; setError(null); setParticipants(result.participants ?? []) }
      } catch { if (!stopped) { setError("Live support presence is reconnecting."); setParticipants([]) } }
      finally {
        busy = false
        if (!stopped) interval = setTimeout(() => void tick(), Math.min(8000, 2000 * 2 ** failures) + Math.random() * 250)
      }
    }
    if (supportAccess) {
      window.addEventListener("pointermove", pointer, { passive: true })
      window.addEventListener("input", editing, true)
    }
    void tick()
    return () => {
      stopped = true
      clearTimeout(interval)
      lifetime.abort()
      window.removeEventListener("pointermove", pointer)
      window.removeEventListener("input", editing, true)
      void workspacePresenceOverHttp({ organizationId, sessionId, path, position: null, editing: false, leave: true })
    }
  }, [organizationId, supportAccess, path])
  return { participants, error, sessionId: session.current, path }
}
