"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { QuickLinksCard, type QuickLink } from "@/features/platform-admin-dashboard"
import { MemberWorkspaceProjectQuickLinkDialog } from "./member-workspace-project-quick-link-dialog"

type MemberWorkspaceProjectQuickLinksCardProps = {
  links: QuickLink[]
  projectId: string
  createQuickLinkAction?: (input: {
    projectId: string
    name: string
    url: string
  }) => Promise<{ ok: true; linkId: string } | { error: string }>
  updateQuickLinkAction?: (input: {
    projectId: string
    linkId: string
    name: string
    url: string
  }) => Promise<{ ok: true; linkId: string } | { error: string }>
  deleteQuickLinkAction?: (input: {
    projectId: string
    linkId: string
  }) => Promise<{ ok: true } | { error: string }>
}

export function MemberWorkspaceProjectQuickLinksCard({
  links,
  projectId,
  createQuickLinkAction,
  updateQuickLinkAction,
  deleteQuickLinkAction,
}: MemberWorkspaceProjectQuickLinksCardProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)

  const editingLink = useMemo(
    () => links.find((link) => link.id === editingLinkId) ?? null,
    [editingLinkId, links],
  )

  const canManageLinks = Boolean(
    createQuickLinkAction && updateQuickLinkAction && deleteQuickLinkAction,
  )

  const openCreate = () => {
    setEditingLinkId(null)
    setIsDialogOpen(true)
  }

  const openEdit = (linkId: string) => {
    setEditingLinkId(linkId)
    setIsDialogOpen(true)
  }

  const handleDelete = async (linkId: string) => {
    if (!deleteQuickLinkAction) return
    const confirmed = window.confirm("Delete this quick link?")
    if (!confirmed) return

    const result = await deleteQuickLinkAction({
      projectId,
      linkId,
    })

    if ("error" in result) {
      toast.error(result.error)
      return
    }

    toast.success("Quick link deleted")
    router.refresh()
  }

  return (
    <>
      <QuickLinksCard
        links={links}
        onAddLink={canManageLinks ? openCreate : undefined}
        onEditLink={canManageLinks ? openEdit : undefined}
        onDeleteLink={canManageLinks ? handleDelete : undefined}
        addLabel="Add link"
        emptyTitle="No quick links"
        emptyDescription="Save important URLs for this project."
      />

      <MemberWorkspaceProjectQuickLinkDialog
        open={isDialogOpen}
        editingLink={editingLink}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingLinkId(null)
          }
        }}
        onSubmit={async ({ name, url }) => {
          const result = editingLink
            ? updateQuickLinkAction
              ? await updateQuickLinkAction({
                  projectId,
                  linkId: editingLink.id,
                  name,
                  url,
                })
              : { error: "Quick-link editing is unavailable." }
            : createQuickLinkAction
              ? await createQuickLinkAction({
                  projectId,
                  name,
                  url,
                })
              : { error: "Quick-link creation is unavailable." }

          if ("error" in result) {
            toast.error(result.error)
            return result
          }

          toast.success(editingLink ? "Quick link updated" : "Quick link created")
          router.refresh()
          return result
        }}
      />
    </>
  )
}
