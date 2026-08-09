"use client"

import { useState } from "react"
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TaskDeleteAction = (
  taskId: string,
) => Promise<
  { ok: true; taskId: string; projectId: string } | { error: string }
>

export function MemberWorkspaceProjectTaskDeleteDialog({
  deleteTaskAction,
  task,
  onDeleted,
  onOpenChange,
}: {
  deleteTaskAction?: TaskDeleteAction
  task: { id: string; name: string } | null
  onDeleted: (taskId: string) => void
  onOpenChange: (open: boolean) => void
}) {
  const [pending, setPending] = useState(false)

  const handleConfirm = async () => {
    if (!deleteTaskAction || !task) return

    setPending(true)
    try {
      const result = await deleteTaskAction(task.id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success("Task deleted")
      onDeleted(task.id)
    } catch {
      toast.error("Task could not be deleted.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(task)}
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes “{task?.name ?? "this task"}”. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              void handleConfirm()
            }}
          >
            {pending ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            Delete task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
