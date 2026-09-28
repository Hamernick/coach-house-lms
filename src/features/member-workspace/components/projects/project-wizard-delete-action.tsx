"use client"

import { useState, useTransition } from "react"
import { toast } from "@/lib/toast"
import { MemberWorkspaceProjectDeleteDialog } from "./member-workspace-project-delete-dialog"

export function ProjectWizardDeleteAction({
  projectId,
  projectName,
  disabled,
  deleteProjectAction,
  onDeleted,
}: {
  projectId: string
  projectName: string
  disabled: boolean
  deleteProjectAction: (
    id: string
  ) => Promise<{ ok: true; id: string } | { error: string }>
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  return (
    <MemberWorkspaceProjectDeleteDialog
      disabled={disabled}
      open={open}
      pending={pending}
      error={error}
      projectName={projectName}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next)
          setError(undefined)
        }
      }}
      onConfirm={() => {
        if (pending) return
        setError(undefined)
        startTransition(async () => {
          try {
            const result = await deleteProjectAction(projectId)
            if ("error" in result) {
              setError(result.error)
              return
            }
            toast.success("Project deleted")
            setOpen(false)
            onDeleted()
          } catch {
            setError("Unable to delete project. Try again.")
          }
        })
      }}
    />
  )
}
