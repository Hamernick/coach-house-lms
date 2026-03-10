import { Component, type ReactNode } from "react"

import type { WorkspaceCardId } from "./workspace-board-types"

export class WorkspaceCardErrorBoundary extends Component<
  {
    cardId: WorkspaceCardId
    children: ReactNode
  },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("[workspace-board] Card render failed.", {
      cardId: this.props.cardId,
      error,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center rounded-[20px] border border-destructive/30 bg-destructive/5 px-4 text-center">
          <p className="text-sm text-destructive">
            This card failed to load. Refresh and try again.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
