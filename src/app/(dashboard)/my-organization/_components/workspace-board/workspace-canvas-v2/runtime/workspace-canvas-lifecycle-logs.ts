"use client"

import { useEffect } from "react"

import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasEvent } from "./workspace-canvas-logger"

export function useWorkspaceCanvasLifecycleLogs(nodeCount: number) {
  useEffect(() => {
    logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CANVAS_MOUNT, {
      mode: "v2",
      card: "organization-overview",
    })
  }, [])

  useEffect(() => {
    logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CANVAS_RENDER_CYCLE, {
      mode: "v2",
      nodeCount,
    })
  }, [nodeCount])
}
