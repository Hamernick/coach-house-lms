"use client"

import { Component, type ReactNode } from "react"

import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasError } from "./workspace-canvas-logger"

type WorkspaceCanvasErrorBoundaryProps = {
  children: ReactNode
}

type WorkspaceCanvasErrorBoundaryState = {
  hasError: boolean
}

export class WorkspaceCanvasErrorBoundary extends Component<
  WorkspaceCanvasErrorBoundaryProps,
  WorkspaceCanvasErrorBoundaryState
> {
  state: WorkspaceCanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    logWorkspaceCanvasError(WORKSPACE_CANVAS_EVENTS.CARD_RENDER_ERROR, {
      error,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Workspace canvas failed to render. Open console for details.
        </div>
      )
    }

    return this.props.children
  }
}
