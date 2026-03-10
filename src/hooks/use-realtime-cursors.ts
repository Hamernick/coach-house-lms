import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js"
import { useCallback, useEffect, useRef, useState } from "react"

import { createClient } from "@/lib/supabase/client"

const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number,
) => {
  const lastCallRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Params) => {
      const now = Date.now()
      const remaining = delay - (now - lastCallRef.current)

      if (remaining <= 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        lastCallRef.current = now
        callback(...args)
        return
      }

      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          lastCallRef.current = Date.now()
          callback(...args)
        }, remaining)
      }
    },
    [callback, delay],
  )
}

const supabase = createClient()

const EVENT_NAME = "realtime-cursor-move"

type CursorEventPayload = {
  position: {
    x: number
    y: number
  }
  user: {
    id: string
    name: string
  }
  color: string
  timestamp: number
}

export type RealtimeConnectionState = "connecting" | "live" | "degraded"

function generateColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`
}

function generateUserId() {
  const maybeId = globalThis.crypto?.randomUUID?.()
  if (maybeId) return maybeId
  return `cursor-${Math.floor(Math.random() * 1_000_000)}`
}

export const useRealtimeCursors = ({
  roomName,
  username,
  throttleMs,
  suspendPublishing = false,
}: {
  roomName: string
  username: string
  throttleMs: number
  suspendPublishing?: boolean
}) => {
  const [color] = useState(generateColor)
  const [userId] = useState(generateUserId)
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>("connecting")

  const channelRef = useRef<RealtimeChannel | null>(null)
  const payloadRef = useRef<CursorEventPayload | null>(null)
  const safeRoomName = roomName.trim().length > 0 ? roomName.trim() : "workspace"

  const publishCursor = useCallback(
    (event: MouseEvent) => {
      if (suspendPublishing) return
      if (document.visibilityState !== "visible") return
      const payload: CursorEventPayload = {
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        user: {
          id: userId,
          name: username,
        },
        color,
        timestamp: Date.now(),
      }

      payloadRef.current = payload
      channelRef.current?.send({
        type: "broadcast",
        event: EVENT_NAME,
        payload,
      })
    },
    [color, suspendPublishing, userId, username],
  )

  const handleMouseMove = useThrottleCallback(publishCursor, throttleMs)

  useEffect(() => {
    const channel = supabase.channel(safeRoomName)
    setConnectionState("connecting")

    channel
      .on("presence", { event: "leave" }, (event: { leftPresences: Array<{ key: string }> }) => {
        for (const presence of event.leftPresences) {
          setCursors((previous) => {
            if (!previous[presence.key]) return previous
            const next = { ...previous }
            delete next[presence.key]
            return next
          })
        }
      })
      .on("presence", { event: "join" }, () => {
        if (!payloadRef.current) return
        channelRef.current?.send({
          type: "broadcast",
          event: EVENT_NAME,
          payload: payloadRef.current,
        })
      })
      .on("broadcast", { event: EVENT_NAME }, (event: { payload: CursorEventPayload }) => {
        if (event.payload.user.id === userId) return
        setCursors((previous) => ({
          ...previous,
          [event.payload.user.id]: event.payload,
        }))
      })
      .subscribe(async (status: string) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({ key: userId })
          channelRef.current = channel
          setConnectionState("live")
          return
        }
        if (
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
          status === REALTIME_SUBSCRIBE_STATES.CLOSED
        ) {
          setConnectionState("degraded")
          setCursors({})
          channelRef.current = null
          return
        }
        setConnectionState("connecting")
      })

    return () => {
      void channel.unsubscribe()
      channelRef.current = null
      setCursors({})
      setConnectionState("connecting")
    }
  }, [safeRoomName, userId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - 15_000
      setCursors((previous) => {
        let changed = false
        const next: Record<string, CursorEventPayload> = {}

        for (const [id, payload] of Object.entries(previous)) {
          if (payload.timestamp >= cutoff) {
            next[id] = payload
            continue
          }
          changed = true
        }

        return changed ? next : previous
      })
    }, 5_000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (suspendPublishing) return
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove, suspendPublishing])

  return { cursors, connectionState }
}
