"use client"

import type { WorkspaceSeedData } from "./workspace-board-types"

export function WorkspaceBoardCanvasLoadingPreview({
  seed: _seed,
}: {
  seed: WorkspaceSeedData
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/95 p-5 shadow-sm">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Workspace
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          Loading canvas
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preparing cards and connections.
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
    </div>
  )
}

export function handleWorkspaceReactFlowError(errorCode: string, message: string) {
  console.warn(`[workspace-board][reactflow:${errorCode}] ${message}`)
}
