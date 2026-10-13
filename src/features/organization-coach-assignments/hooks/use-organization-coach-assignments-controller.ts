"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type {
  OrganizationCoachAssignment,
  OrganizationCoachOption,
  UpdateOrganizationCoachAssignmentInput,
  UpdateOrganizationCoachAssignmentResult,
} from "../types"

type AssignmentAction = (
  input: UpdateOrganizationCoachAssignmentInput
) => Promise<UpdateOrganizationCoachAssignmentResult>

export function useOrganizationCoachAssignmentController({
  assignments: initialAssignments,
  organizationId,
  preventEmpty,
  updateAssignmentAction,
}: {
  assignments: OrganizationCoachAssignment[]
  organizationId: string
  preventEmpty: boolean
  updateAssignmentAction?: AssignmentAction
}) {
  const router = useRouter()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => setAssignments(initialAssignments), [initialAssignments])

  const assignedCoachIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.coach.id)),
    [assignments]
  )

  const toggle = (coach: OrganizationCoachOption) => {
    if (!updateAssignmentAction || pending) return
    const removing = assignedCoachIds.has(coach.id)
    if (removing && preventEmpty && assignments.length === 1) return

    const previous = assignments
    const next = removing
      ? assignments.filter((assignment) => assignment.coach.id !== coach.id)
      : [
          ...assignments,
          {
            organizationId,
            coach,
            assignedBy: null,
            updatedAt: new Date().toISOString(),
          },
        ].sort((left, right) => left.coach.name.localeCompare(right.coach.name))
    setAssignments(next)

    startTransition(async () => {
      const result = await updateAssignmentAction({
        organizationId,
        coachUserIds: next.map((assignment) => assignment.coach.id),
      })
      if ("error" in result) {
        setAssignments(previous)
        toast.error(result.error)
        return
      }
      toast.success(
        removing ? `Removed ${coach.name}` : `Assigned ${coach.name}`
      )
      router.refresh()
    })
  }

  return { assignedCoachIds, assignments, open, pending, setOpen, toggle }
}
