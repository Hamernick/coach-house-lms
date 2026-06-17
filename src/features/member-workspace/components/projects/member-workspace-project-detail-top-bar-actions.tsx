"use client"

import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/features/platform-admin-dashboard"
import { MemberWorkspaceProjectDeleteDialog } from "./member-workspace-project-delete-dialog"

export type ProjectDetailTopBarActionsProps = {
  canDeleteProject: boolean
  deleteProjectName: string
  hasProjectChanges: boolean
  isDeletingProject: boolean
  isEditing: boolean
  isSavingProject: boolean
  deleteProjectOpen: boolean
  showMeta: boolean
  onCancelProjectEditing: () => void
  onCopyLink: () => void
  onDeleteProject: () => void
  onDeleteProjectOpenChange: (open: boolean) => void
  onSaveProject: () => void
  onToggleMeta: () => void
}

export function ProjectDetailTopBarActions({
  canDeleteProject,
  deleteProjectName,
  hasProjectChanges,
  isDeletingProject,
  isEditing,
  isSavingProject,
  deleteProjectOpen,
  showMeta,
  onCancelProjectEditing,
  onCopyLink,
  onDeleteProject,
  onDeleteProjectOpenChange,
  onSaveProject,
  onToggleMeta,
}: ProjectDetailTopBarActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isEditing ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelProjectEditing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasProjectChanges || isSavingProject}
            onClick={onSaveProject}
          >
            {isSavingProject ? "Saving..." : "Save changes"}
          </Button>
        </>
      ) : null}
      {canDeleteProject ? (
        <MemberWorkspaceProjectDeleteDialog
          disabled={isEditing}
          open={deleteProjectOpen}
          pending={isDeletingProject}
          projectName={deleteProjectName}
          onConfirm={onDeleteProject}
          onOpenChange={onDeleteProjectOpenChange}
        />
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Copy link"
        onClick={onCopyLink}
      >
        <LinkSimple className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={!showMeta}
        aria-label={showMeta ? "Collapse meta panel" : "Expand meta panel"}
        className={showMeta ? "bg-muted" : ""}
        onClick={onToggleMeta}
      >
        <SquareHalf className="h-4 w-4" weight="duotone" />
      </Button>
    </div>
  )
}
