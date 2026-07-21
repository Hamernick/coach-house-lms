"use client"

import { useEffect, useState, useTransition } from "react"
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
  assignment: initialAssignment,
  organizationId,
  updateAssignmentAction,
}: {
  assignment: OrganizationCoachAssignment | null
  organizationId: string
  updateAssignmentAction?: AssignmentAction
}) {
  const router = useRouter()
  const [assignment, setAssignment] = useState(initialAssignment)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => setAssignment(initialAssignment), [initialAssignment])

  const assign = (coach: OrganizationCoachOption | null) => {
    if (!updateAssignmentAction || pending) return
    const previous = assignment
    setAssignment(
      coach
        ? {
            organizationId,
            coach,
            assignedBy: null,
            updatedAt: new Date().toISOString(),
          }
        : null
    )
    setOpen(false)

    startTransition(async () => {
      const result = await updateAssignmentAction({
        organizationId,
        coachUserId: coach?.id ?? null,
      })
      if ("error" in result) {
        setAssignment(previous)
        toast.error(result.error)
        return
      }
      toast.success(coach ? `Assigned ${coach.name}` : "Coach unassigned")
      router.refresh()
    })
  }

  return { assignment, assign, open, pending, setOpen }
}
