"use client"

import { useMemo } from "react"

import {
  arrangeWorkspaceOntologyBranchGeometry,
  buildWorkspaceOntologyProjection,
  buildWorkspaceOntologyRootAttentionCounts,
  buildWorkspaceOntologyRootCompletedCounts,
  buildWorkspaceOntologyRootDescendantCounts,
} from "../lib"
import {
  type WorkspaceOntologyInput,
  type WorkspaceOntologyObstacle,
  type WorkspaceOntologyRootGeometry,
  type WorkspaceOntologyRootId,
  type WorkspaceOntologyState,
} from "../types"

export function useWorkspaceOntologyProjection({
  input,
  state,
  rootGeometry,
  obstacles,
}: {
  input: WorkspaceOntologyInput
  state: WorkspaceOntologyState
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
  obstacles: WorkspaceOntologyObstacle[]
}) {
  const projection = useMemo(
    () =>
      buildWorkspaceOntologyProjection({
        input,
        state,
        filter: { query: "", categories: [] },
      }),
    [input, state]
  )
  const descendantCounts = useMemo(
    () => buildWorkspaceOntologyRootDescendantCounts(input),
    [input]
  )
  const attentionCounts = useMemo(
    () => buildWorkspaceOntologyRootAttentionCounts(input),
    [input]
  )
  const completedCounts = useMemo(
    () => buildWorkspaceOntologyRootCompletedCounts(input),
    [input]
  )
  const layoutRootGeometry = useMemo(
    () =>
      arrangeWorkspaceOntologyBranchGeometry({
        projection,
        rootGeometry,
        obstacles,
      }),
    [obstacles, projection, rootGeometry]
  )

  return {
    layoutRootGeometry,
    attentionCounts,
    completedCounts,
    descendantCounts,
    projection,
  }
}
