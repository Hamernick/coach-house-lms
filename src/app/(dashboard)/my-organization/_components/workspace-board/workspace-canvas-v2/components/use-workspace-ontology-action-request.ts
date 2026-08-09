"use client"

import { useCallback, useRef, useState } from "react"

import type {
  WorkspaceOntologyActionRequest,
  WorkspaceOntologyActionTarget,
  WorkspaceOntologyRootId,
} from "@/features/workspace-ontology"

export function useWorkspaceOntologyActionRequest(
  onFocusCard: (cardId: WorkspaceOntologyRootId) => void
) {
  const requestIdRef = useRef(0)
  const [request, setRequest] = useState<WorkspaceOntologyActionRequest | null>(
    null
  )
  const openAction = useCallback(
    (
      rootId: WorkspaceOntologyRootId,
      target: WorkspaceOntologyActionTarget
    ) => {
      requestIdRef.current += 1
      setRequest({ id: requestIdRef.current, rootId, target })
      onFocusCard(rootId)
    },
    [onFocusCard]
  )

  return { request, openAction }
}
