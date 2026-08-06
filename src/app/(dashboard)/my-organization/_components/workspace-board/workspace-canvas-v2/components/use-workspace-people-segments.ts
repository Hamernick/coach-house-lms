"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  addOrganizationPeopleSegmentMembersAction,
  createOrganizationPeopleSegmentAction,
  deleteOrganizationPeopleSegmentAction,
  removeOrganizationPeopleSegmentMembersAction,
  renameOrganizationPeopleSegmentAction,
} from "@/actions/people-segments"
import type { OrganizationPeopleSegment } from "@/lib/people/segments"

import type { WorkspaceCustomPeopleSegment } from "./workspace-canvas-people-segment-types"
import { createWorkspacePeopleMutationCoordinator } from "./workspace-people-optimistic-mutations"

function buildInitialCustomSegments(
  segments: OrganizationPeopleSegment[]
): WorkspaceCustomPeopleSegment[] {
  return segments.map((segment) => ({
    ...segment,
    kind: "custom",
    count: segment.memberIds.length,
  }))
}

function copyCustomSegment(
  segment: WorkspaceCustomPeopleSegment
): WorkspaceCustomPeopleSegment {
  return { ...segment, memberIds: [...segment.memberIds] }
}

function replaceCustomSegment(
  segments: WorkspaceCustomPeopleSegment[],
  replacement: WorkspaceCustomPeopleSegment
) {
  return segments.map((segment) =>
    segment.id === replacement.id ? copyCustomSegment(replacement) : segment
  )
}

function withSegmentMemberIds(
  segment: WorkspaceCustomPeopleSegment,
  memberIds: string[]
): WorkspaceCustomPeopleSegment {
  return { ...segment, count: memberIds.length, memberIds }
}

export function useWorkspacePeopleSegments(
  initialSegments: OrganizationPeopleSegment[]
) {
  const [customSegments, setCustomSegments] = useState<
    WorkspaceCustomPeopleSegment[]
  >(() => buildInitialCustomSegments(initialSegments))
  const [confirmedSegments] = useState(
    () =>
      new Map(
        buildInitialCustomSegments(initialSegments).map((segment) => [
          segment.id,
          copyCustomSegment(segment),
        ])
      )
  )
  const [mutationCoordinator] = useState(
    createWorkspacePeopleMutationCoordinator
  )
  const [, startMutation] = useTransition()

  useEffect(() => {
    const nextSegments = buildInitialCustomSegments(initialSegments)
    mutationCoordinator.reset()
    confirmedSegments.clear()
    nextSegments.forEach((segment) => {
      confirmedSegments.set(segment.id, copyCustomSegment(segment))
    })
    setCustomSegments(nextSegments)
  }, [confirmedSegments, initialSegments, mutationCoordinator])

  const createSegment = useCallback(
    (
      label: string,
      onCreated: (segment: WorkspaceCustomPeopleSegment) => void,
      memberIds: string[] = []
    ) => {
      startMutation(async () => {
        const result = await createOrganizationPeopleSegmentAction(
          label,
          memberIds
        )
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        const nextSegment: WorkspaceCustomPeopleSegment = {
          ...result.segment,
          kind: "custom",
          count: result.segment.memberIds.length,
        }
        setCustomSegments((current) =>
          current.some((segment) => segment.id === nextSegment.id)
            ? current
            : [...current, nextSegment]
        )
        confirmedSegments.set(nextSegment.id, copyCustomSegment(nextSegment))
        onCreated(nextSegment)
      })
    },
    [confirmedSegments, startMutation]
  )

  const renameSegment = useCallback(
    (segmentId: string, label: string) => {
      const previousSegment = customSegments.find(
        (segment) => segment.id === segmentId
      )
      const nextLabel = label.trim() || previousSegment?.label
      if (!previousSegment || !nextLabel) return
      const mutationKey = `segment:${segmentId}`
      const mutationToken = mutationCoordinator.begin(mutationKey)
      setCustomSegments((current) =>
        current.map((segment) =>
          segment.id === segmentId ? { ...segment, label: nextLabel } : segment
        )
      )
      startMutation(async () => {
        const result = await mutationCoordinator.run(mutationKey, () =>
          renameOrganizationPeopleSegmentAction(segmentId, nextLabel)
        )
        if ("error" in result) {
          if (mutationCoordinator.isLatest(mutationToken)) {
            const confirmedSegment = confirmedSegments.get(segmentId)
            if (confirmedSegment) {
              setCustomSegments((current) =>
                replaceCustomSegment(current, confirmedSegment)
              )
            }
          }
          toast.error(result.error)
          return
        }
        if (!mutationCoordinator.isCurrent(mutationToken)) return

        const confirmedSegment = confirmedSegments.get(segmentId)
        if (!confirmedSegment) return
        const nextConfirmedSegment = {
          ...confirmedSegment,
          label: nextLabel,
        }
        confirmedSegments.set(segmentId, nextConfirmedSegment)
        if (mutationCoordinator.isLatest(mutationToken)) {
          setCustomSegments((current) =>
            replaceCustomSegment(current, nextConfirmedSegment)
          )
        }
      })
    },
    [confirmedSegments, customSegments, mutationCoordinator, startMutation]
  )

  const removeSegment = useCallback(
    (segmentId: string) => {
      const removedIndex = customSegments.findIndex(
        (segment) => segment.id === segmentId
      )
      const removedSegment = customSegments[removedIndex]
      if (!removedSegment) return
      const mutationKey = `segment:${segmentId}`
      const mutationToken = mutationCoordinator.begin(mutationKey)
      setCustomSegments((current) =>
        current.filter((segment) => segment.id !== segmentId)
      )
      startMutation(async () => {
        const result = await mutationCoordinator.run(mutationKey, () =>
          deleteOrganizationPeopleSegmentAction(segmentId)
        )
        if ("error" in result) {
          if (mutationCoordinator.isLatest(mutationToken)) {
            const confirmedSegment =
              confirmedSegments.get(segmentId) ?? removedSegment
            setCustomSegments((current) => {
              if (current.some((segment) => segment.id === segmentId)) {
                return current
              }
              const next = [...current]
              next.splice(removedIndex, 0, copyCustomSegment(confirmedSegment))
              return next
            })
          }
          toast.error(result.error)
          return
        }
        if (mutationCoordinator.isCurrent(mutationToken)) {
          confirmedSegments.delete(segmentId)
        }
      })
    },
    [confirmedSegments, customSegments, mutationCoordinator, startMutation]
  )

  const addPeopleToSegment = useCallback(
    (segmentId: string, personIds: string[]) => {
      const segment = customSegments.find((item) => item.id === segmentId)
      if (!segment) return
      const existingIds = new Set(segment.memberIds)
      const addedIds = Array.from(
        new Set(personIds.map((personId) => personId.trim()).filter(Boolean))
      ).filter((personId) => !existingIds.has(personId))
      if (addedIds.length === 0) return
      const mutationKey = `segment:${segmentId}`
      const mutationToken = mutationCoordinator.begin(mutationKey)
      setCustomSegments((current) =>
        current.map((item) =>
          item.id === segmentId
            ? withSegmentMemberIds(
                item,
                Array.from(new Set([...item.memberIds, ...addedIds]))
              )
            : item
        )
      )
      startMutation(async () => {
        const result = await mutationCoordinator.run(mutationKey, () =>
          addOrganizationPeopleSegmentMembersAction(segmentId, addedIds)
        )
        if (
          !("error" in result) &&
          mutationCoordinator.isCurrent(mutationToken)
        ) {
          const confirmedSegment = confirmedSegments.get(segmentId)
          if (confirmedSegment) {
            confirmedSegments.set(
              segmentId,
              withSegmentMemberIds(
                confirmedSegment,
                Array.from(
                  new Set([...confirmedSegment.memberIds, ...addedIds])
                )
              )
            )
          }
        }
        if (mutationCoordinator.isLatest(mutationToken)) {
          const confirmedSegment = confirmedSegments.get(segmentId)
          if (confirmedSegment) {
            setCustomSegments((current) =>
              replaceCustomSegment(current, confirmedSegment)
            )
          }
        }
        if ("error" in result) toast.error(result.error)
      })
    },
    [confirmedSegments, customSegments, mutationCoordinator, startMutation]
  )

  const removePersonFromSegment = useCallback(
    (segmentId: string, personId: string) => {
      const segment = customSegments.find((item) => item.id === segmentId)
      const removedIndex = segment?.memberIds.indexOf(personId) ?? -1
      if (removedIndex < 0) return
      const mutationKey = `segment:${segmentId}`
      const mutationToken = mutationCoordinator.begin(mutationKey)
      setCustomSegments((current) =>
        current.map((item) =>
          item.id === segmentId
            ? withSegmentMemberIds(
                item,
                item.memberIds.filter((memberId) => memberId !== personId)
              )
            : item
        )
      )
      startMutation(async () => {
        const result = await mutationCoordinator.run(mutationKey, () =>
          removeOrganizationPeopleSegmentMembersAction(segmentId, [personId])
        )
        if (
          !("error" in result) &&
          mutationCoordinator.isCurrent(mutationToken)
        ) {
          const confirmedSegment = confirmedSegments.get(segmentId)
          if (confirmedSegment) {
            confirmedSegments.set(
              segmentId,
              withSegmentMemberIds(
                confirmedSegment,
                confirmedSegment.memberIds.filter(
                  (memberId) => memberId !== personId
                )
              )
            )
          }
        }
        if (mutationCoordinator.isLatest(mutationToken)) {
          const confirmedSegment = confirmedSegments.get(segmentId)
          if (confirmedSegment) {
            setCustomSegments((current) =>
              replaceCustomSegment(current, confirmedSegment)
            )
          }
        }
        if ("error" in result) toast.error(result.error)
      })
    },
    [confirmedSegments, customSegments, mutationCoordinator, startMutation]
  )

  return {
    addPeopleToSegment,
    createSegment,
    customSegments,
    removePersonFromSegment,
    removeSegment,
    renameSegment,
  }
}
