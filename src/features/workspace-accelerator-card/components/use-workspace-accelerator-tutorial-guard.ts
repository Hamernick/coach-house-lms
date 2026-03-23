"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { WorkspaceAcceleratorTutorialBlockedAction } from "../types"

type UseWorkspaceAcceleratorTutorialGuardOptions = {
  enabled: boolean
  defaultMessage: string
  durationMs: number
}

export function useWorkspaceAcceleratorTutorialGuard({
  enabled,
  defaultMessage,
  durationMs,
}: UseWorkspaceAcceleratorTutorialGuardOptions) {
  const timeoutRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const hideBlockedFeedback = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setOpen(false)
  }, [])

  const showBlockedFeedback = useCallback(
    (
      _action: WorkspaceAcceleratorTutorialBlockedAction,
      messageOverride?: string,
    ) => {
      if (!enabled) {
        return
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      setMessage(messageOverride ?? defaultMessage)
      setOpen(true)
      timeoutRef.current = window.setTimeout(() => {
        setOpen(false)
        timeoutRef.current = null
      }, durationMs)
    },
    [defaultMessage, durationMs, enabled],
  )

  useEffect(() => () => hideBlockedFeedback(), [hideBlockedFeedback])

  return {
    open,
    message,
    showBlockedFeedback,
    hideBlockedFeedback,
  }
}
