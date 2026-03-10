'use client'

import { useEffect } from "react"

import { Cursor } from '@/components/cursor'
import { useRealtimeCursors, type RealtimeConnectionState } from '@/hooks/use-realtime-cursors'
import { cn } from "@/lib/utils"

const THROTTLE_MS = 50

export const RealtimeCursors = ({
  roomName,
  username,
  onConnectionStateChange,
  showStatusBanner = true,
  suspendPublishing = false,
}: {
  roomName: string
  username: string
  onConnectionStateChange?: (nextState: RealtimeConnectionState) => void
  showStatusBanner?: boolean
  suspendPublishing?: boolean
}) => {
  const { cursors, connectionState } = useRealtimeCursors({
    roomName,
    username,
    throttleMs: THROTTLE_MS,
    suspendPublishing,
  })

  useEffect(() => {
    onConnectionStateChange?.(connectionState)
  }, [connectionState, onConnectionStateChange])

  return (
    <div className="pointer-events-none">
      {Object.keys(cursors).map((id) => (
        <Cursor
          key={id}
          className="fixed transition-transform ease-in-out z-50"
          style={{
            transitionDuration: '20ms',
            top: 0,
            left: 0,
            transform: `translate(${cursors[id].position.x}px, ${cursors[id].position.y}px)`,
          }}
          color={cursors[id].color}
          name={cursors[id].user.name}
        />
      ))}
      {showStatusBanner && connectionState !== "live" ? (
        <div
          className={cn(
            "absolute left-3 top-3 rounded-md border border-border/60 bg-card/90 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm",
            connectionState === "degraded" && "text-amber-600 dark:text-amber-300",
          )}
          aria-live="polite"
        >
          {connectionState === "connecting" ? "Connecting live cursors…" : "Realtime cursors offline"}
        </div>
      ) : null}
    </div>
  )
}
