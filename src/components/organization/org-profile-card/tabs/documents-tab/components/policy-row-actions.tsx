"use client"

import Download from "lucide-react/dist/esm/icons/download"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DocumentsPolicyEntry, PolicyRow } from "../types"

type PolicyRowActionsProps = {
  row: PolicyRow
  canEdit: boolean
  editMode: boolean
  deleting: boolean
  viewingDocument: boolean
  downloadingDocument: boolean
  onEdit: (policy: DocumentsPolicyEntry) => void
  onDelete: (policy: DocumentsPolicyEntry) => Promise<void>
  onViewDocument: (policy: DocumentsPolicyEntry) => Promise<void>
  onDownloadDocument: (policy: DocumentsPolicyEntry) => Promise<void>
}

export function PolicyRowActions({
  row,
  canEdit,
  editMode,
  deleting,
  viewingDocument,
  downloadingDocument,
  onEdit,
  onDelete,
  onViewDocument,
  onDownloadDocument,
}: PolicyRowActionsProps) {
  return (
    <div className="flex min-w-[170px] items-center justify-end gap-1.5">
      {row.policy.document?.path ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              disabled={viewingDocument}
              onClick={() => void onViewDocument(row.policy)}
              aria-label="View policy file"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {viewingDocument ? "Opening…" : "View"}
          </TooltipContent>
        </Tooltip>
      ) : null}
      {row.policy.document?.path ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={downloadingDocument}
              onClick={() => void onDownloadDocument(row.policy)}
              aria-label="Download policy file"
            >
              <Download className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {downloadingDocument ? "Preparing…" : "Download"}
          </TooltipContent>
        </Tooltip>
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
