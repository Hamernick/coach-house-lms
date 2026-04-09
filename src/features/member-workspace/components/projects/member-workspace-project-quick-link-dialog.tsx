"use client"

import { useEffect, useState } from "react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  type QuickLink,
} from "@/features/platform-admin-dashboard"

type MemberWorkspaceProjectQuickLinkDialogProps = {
  open: boolean
  editingLink?: QuickLink | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { name: string; url: string }) => Promise<unknown>
}

export function MemberWorkspaceProjectQuickLinkDialog({
  open,
  editingLink,
  onOpenChange,
  onSubmit,
}: MemberWorkspaceProjectQuickLinkDialogProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(editingLink?.name ?? "")
    setUrl(editingLink?.url ?? "")
    setIsSubmitting(false)
  }, [editingLink, open])

  const isEditing = Boolean(editingLink)
  const canSubmit = name.trim().length > 0 && url.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        name,
        url,
      })
      if (
        !result ||
        typeof result !== "object" ||
        !("error" in result) ||
        !result.error
      ) {
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit quick link" : "Add quick link"}</DialogTitle>
          <DialogDescription>
            Save a URL that teammates can jump to from the project sidebar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="quick-link-name">
              Title
            </label>
            <Input
              id="quick-link-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Board review dashboard"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="quick-link-url">
              URL
            </label>
            <Input
              id="quick-link-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isEditing ? "Save link" : "Create link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
