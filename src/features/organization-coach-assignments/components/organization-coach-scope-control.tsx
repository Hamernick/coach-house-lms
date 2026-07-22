"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleNotch, ShieldCheck } from "@phosphor-icons/react/dist/ssr"

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
  OrganizationCoachAssignmentCoverage,
  OrganizationCoachScopeStatus,
  SetOrganizationCoachScopeAction,
} from "../types"

export function OrganizationCoachScopeControl({
  coverage,
  scopeStatus,
  setScopeAction,
}: {
  coverage: OrganizationCoachAssignmentCoverage
  scopeStatus: OrganizationCoachScopeStatus
  setScopeAction: SetOrganizationCoachScopeAction
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const enabled = scopeStatus.assignedOnlyEnabled
  const canEnable = coverage.total > 0 && coverage.unassigned === 0
  const nextEnabled = !enabled

  const handleChange = () => {
    startTransition(async () => {
      const result = await setScopeAction(nextEnabled)
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      setOpen(false)
      toast.success(
        result.assignedOnlyEnabled
          ? "Coach visibility limited to assigned organizations"
          : "Coach visibility restored to all organizations"
      )
      router.refresh()
    })
  }

  const blockedLabel = `${coverage.unassigned} ${
    coverage.unassigned === 1 ? "organization remains" : "organizations remain"
  } unassigned`

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
          <ShieldCheck className="text-muted-foreground size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-foreground text-sm font-medium">
            Coach visibility: {enabled ? "Assigned only" : "All organizations"}
          </p>
          <p className="text-muted-foreground text-xs">
            {enabled
              ? "Coaches can open only their assigned organizations."
              : canEnable
                ? "Every organization is assigned. Scoping is ready."
                : `${blockedLabel}. Assign them before enabling scoping.`}
          </p>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant={enabled ? "outline" : "default"}
            size="sm"
            className="h-11 shrink-0 sm:h-9"
            disabled={isPending || (!enabled && !canEnable)}
          >
            {enabled ? "Restore All Access…" : "Enable Assigned-only…"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextEnabled
                ? "Enable assigned-only coach visibility?"
                : "Restore all-organization coach visibility?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextEnabled
                ? "Coaches will immediately see and manage only organizations assigned to them. Developers keep full access."
                : "Coaches will immediately regain access to every organization. Existing assignments will stay unchanged."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleChange()
              }}
              disabled={isPending}
            >
              {isPending ? (
                <CircleNotch className="size-4 animate-spin" aria-hidden />
              ) : null}
              {nextEnabled ? "Enable Assigned-only" : "Restore All Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
