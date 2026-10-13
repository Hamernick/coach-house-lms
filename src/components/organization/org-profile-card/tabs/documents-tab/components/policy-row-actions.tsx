"use client"

import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import type { DocumentsPolicyEntry, PolicyRow } from "../types"

type PolicyRowActionsProps = {
  row: PolicyRow
  canEdit: boolean
  editMode: boolean
  deleting: boolean
  viewingDocument: boolean
  onEdit: (policy: DocumentsPolicyEntry) => void
  onDelete: (policy: DocumentsPolicyEntry) => Promise<void>
  onViewDocument: (policy: DocumentsPolicyEntry) => Promise<void>
}

export function PolicyRowActions({
  row,
  canEdit,
  editMode,
  deleting,
  viewingDocument,
  onEdit,
  onDelete,
  onViewDocument,
}: PolicyRowActionsProps) {
  return (
    <div className="flex min-w-[160px] items-center justify-end gap-2">
      {row.policy.document?.path ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={viewingDocument}
          onClick={() => void onViewDocument(row.policy)}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {viewingDocument ? "Opening…" : "View"}
        </Button>
      ) : null}
      {canEdit && editMode ? (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(row.policy)}>
            Edit
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={deleting}
            aria-label={`Delete ${row.policy.title}`}
            onClick={() => void onDelete(row.policy)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">View only</span>
      )}
    </div>
  )
}
