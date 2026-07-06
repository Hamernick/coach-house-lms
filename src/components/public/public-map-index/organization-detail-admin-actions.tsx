"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import EyeOffIcon from "lucide-react/dist/esm/icons/eye-off"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

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
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

import { PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME } from "./sidebar-theme"

type OrganizationMapProfileAction = "hide" | "delete"

export type PublicMapOrganizationCurationAction = (input: {
  organizationId: string
  action: OrganizationMapProfileAction
  reason?: string | null
}) => Promise<{ ok: true; id: string } | { error: string }>

function OrganizationMapAdminActionDialog({
  action,
  curationAction,
  onComplete,
  organization,
}: {
  action: OrganizationMapProfileAction
  curationAction: PublicMapOrganizationCurationAction
  onComplete?: () => void
  organization: PublicMapOrganization
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isDelete = action === "delete"
  const Icon = isDelete ? Trash2Icon : EyeOffIcon
  const label = isDelete ? "Delete" : "Hide"
  const actionLabel = `${label} ${organization.name} from public map`

  function handleConfirm() {
    startTransition(async () => {
      const result = await curationAction({
        organizationId: organization.id,
        action,
        reason: `${label} from /find organization profile.`,
      })

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      setOpen(false)
      toast.success(
        isDelete ? "Organization removed from map" : "Organization hidden"
      )
      onComplete?.()
      router.replace("/find")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isPending}
          className={cn(
            "h-8 w-8 rounded-full",
            PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
            isDelete && "text-destructive hover:text-destructive"
          )}
          aria-label={actionLabel}
          title={actionLabel}
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Icon className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete
              ? "Remove this organization from the public map?"
              : "Hide this organization?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? "This removes the organization from public map results. It does not delete the workspace, account, or organization record."
              : "This hides the organization from public map results. It does not delete the workspace, account, or organization record."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
            className={cn(
              isDelete &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function PublicMapOrganizationAdminActions({
  curationAction,
  onComplete,
  organization,
}: {
  curationAction: PublicMapOrganizationCurationAction
  onComplete?: () => void
  organization: PublicMapOrganization
}) {
  return (
    <div
      data-public-map-organization-admin-actions
      className="flex items-center gap-1.5"
    >
      <OrganizationMapAdminActionDialog
        action="hide"
        curationAction={curationAction}
        organization={organization}
        onComplete={onComplete}
      />
      <OrganizationMapAdminActionDialog
        action="delete"
        curationAction={curationAction}
        organization={organization}
        onComplete={onComplete}
      />
    </div>
  )
}
