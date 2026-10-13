"use client"

import { CircleNotch, Trash } from "@phosphor-icons/react/dist/ssr"

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
import { Button } from "@/features/platform-admin-dashboard"

export function MemberWorkspaceProjectDeleteDialog({
  disabled = false,
  open,
  pending,
  projectName,
  onConfirm,
  onOpenChange,
}: {
  disabled?: boolean
  open: boolean
  pending: boolean
  projectName: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={disabled || pending}
        >
          <Trash data-icon="inline-start" weight="bold" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {projectName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the organization record and its related workspace
            detail records. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {pending ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            Delete organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
