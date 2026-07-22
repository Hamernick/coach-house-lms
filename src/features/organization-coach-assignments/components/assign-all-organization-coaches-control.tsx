"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleNotch, UsersThree } from "@phosphor-icons/react/dist/ssr"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import type {
  AssignAllOrganizationCoachesAction,
  OrganizationCoachAssignmentCoverage,
} from "../types"

export function AssignAllOrganizationCoachesControl({
  action,
  coachCount,
  coverage,
}: {
  action: AssignAllOrganizationCoachesAction
  coachCount: number
  coverage: OrganizationCoachAssignmentCoverage
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const targetAssignmentCount = coachCount * coverage.totalOrganizations
  const complete =
    targetAssignmentCount > 0 &&
    coverage.assignmentCount === targetAssignmentCount

  const handleAssignAll = () => {
    startTransition(async () => {
      const result = await action()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      toast.success(
        result.addedCount > 0
          ? `Added ${result.addedCount} coach assignments`
          : "Every coach is already assigned"
      )
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 shrink-0 sm:h-9"
          disabled={pending || complete || targetAssignmentCount === 0}
        >
          <UsersThree className="size-4" aria-hidden />
          {complete ? "Every coach assigned" : "Assign every coach…"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Assign every coach?</AlertDialogTitle>
          <AlertDialogDescription>
            This will assign all {coachCount} coaches to all{" "}
            {coverage.totalOrganizations} organizations, creating up to{" "}
            {targetAssignmentCount} total assignments. Existing assignments
            stay unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              handleAssignAll()
            }}
          >
            {pending ? (
              <CircleNotch className="size-4 animate-spin" aria-hidden />
            ) : null}
            Assign Every Coach
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
