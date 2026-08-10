"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getOrganizationKanbanVisibilityIdsSignature } from "../lib"
import type { UpdateOrganizationKanbanVisibilityAction } from "../types"

export function useOrganizationKanbanVisibilityController({
  initialHiddenOrganizationIds,
  updateVisibilityAction,
}: {
  initialHiddenOrganizationIds: string[]
  updateVisibilityAction?: UpdateOrganizationKanbanVisibilityAction
}) {
  const router = useRouter()
  const [hiddenOrganizationIds, setHiddenOrganizationIds] = useState(
    initialHiddenOrganizationIds
  )
  const [pendingOrganizationIds, setPendingOrganizationIds] = useState<
    string[]
  >([])
  const [, startTransition] = useTransition()
  const initialHiddenOrganizationIdsRef = useRef(initialHiddenOrganizationIds)
  initialHiddenOrganizationIdsRef.current = initialHiddenOrganizationIds
  const initialHiddenOrganizationIdsSignature =
    getOrganizationKanbanVisibilityIdsSignature(initialHiddenOrganizationIds)

  useEffect(() => {
    setHiddenOrganizationIds(initialHiddenOrganizationIdsRef.current)
  }, [initialHiddenOrganizationIdsSignature])

  const hiddenOrganizationIdSet = useMemo(
    () => new Set(hiddenOrganizationIds),
    [hiddenOrganizationIds]
  )

  const setOrganizationHidden = (organizationId: string, hidden: boolean) => {
    if (
      !updateVisibilityAction ||
      pendingOrganizationIds.includes(organizationId)
    ) {
      return
    }

    setHiddenOrganizationIds((current) =>
      hidden
        ? Array.from(new Set([...current, organizationId]))
        : current.filter((value) => value !== organizationId)
    )
    setPendingOrganizationIds((current) => [...current, organizationId])

    startTransition(async () => {
      const result = await updateVisibilityAction({ organizationId, hidden })
      setPendingOrganizationIds((current) =>
        current.filter((value) => value !== organizationId)
      )

      if ("error" in result) {
        setHiddenOrganizationIds((current) =>
          hidden
            ? current.filter((value) => value !== organizationId)
            : Array.from(new Set([...current, organizationId]))
        )
        toast.error(result.error)
        return
      }

      toast.success(hidden ? "Hidden from your Kanban" : "Shown on your Kanban")
      router.refresh()
    })
  }

  return {
    hiddenOrganizationIdSet,
    pendingOrganizationIds,
    setOrganizationHidden,
  }
}
