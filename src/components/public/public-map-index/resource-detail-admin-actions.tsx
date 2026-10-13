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
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"

import { PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME } from "./sidebar-theme"

type ResourceMapProfileAction = "hide" | "delete"

export type PublicMapResourceCurationAction = (input: {
  target: "service"
  id: string
  action: ResourceMapProfileAction
  reason?: string | null
}) => Promise<{ ok: true; id: string } | { error: string }>

const RESOURCE_MAP_ITEM_PREFIX = "resource_map:"

function resolveCanonicalServiceId(item: ExternalResourceMapItem) {
  if (!item.id.startsWith(RESOURCE_MAP_ITEM_PREFIX)) return null
  const serviceId = item.id.slice(RESOURCE_MAP_ITEM_PREFIX.length).trim()
  return serviceId || item.services?.[0]?.id || null
}

function ResourceMapAdminActionDialog({
  action,
  curationAction,
  item,
  onComplete,
  serviceId,
}: {
  action: ResourceMapProfileAction
  curationAction: PublicMapResourceCurationAction
  item: ExternalResourceMapItem
  onComplete?: () => void
  serviceId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isDelete = action === "delete"
  const Icon = isDelete ? Trash2Icon : EyeOffIcon
  const label = isDelete ? "Delete" : "Hide"
  const actionLabel = `${label} ${item.title}`

  function handleConfirm() {
    startTransition(async () => {
      const result = await curationAction({
        target: "service",
        id: serviceId,
        action,
        reason: `${label} from /find resource profile.`,
      })

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      setOpen(false)
      toast.success(isDelete ? "Resource deleted" : "Resource hidden")
      onComplete?.()
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
            {isDelete ? "Delete this resource?" : "Hide this resource?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? "This removes the resource from public map results and records a delete audit event."
              : "This removes the resource from public map results and records a hide audit event."}
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

export function PublicMapResourceAdminActions({
  curationAction,
  item,
  onComplete,
}: {
  curationAction: PublicMapResourceCurationAction
  item: ExternalResourceMapItem
  onComplete?: () => void
}) {
  const serviceId = resolveCanonicalServiceId(item)
  if (!serviceId) return null

  return (
    <div
      data-public-map-resource-admin-actions
      className="flex items-center gap-1.5"
    >
      <ResourceMapAdminActionDialog
        action="hide"
        curationAction={curationAction}
        item={item}
        serviceId={serviceId}
        onComplete={onComplete}
      />
      <ResourceMapAdminActionDialog
        action="delete"
        curationAction={curationAction}
        item={item}
        serviceId={serviceId}
        onComplete={onComplete}
      />
    </div>
  )
}
