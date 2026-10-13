"use client"

import { useId } from "react"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { formatBytes, formatUpdatedAt } from "../helpers"
import type { PolicyDraft } from "../types"

type PolicyFileFieldProps = {
  document: PolicyDraft["document"]
  pendingDocumentName: string | null
  pendingDocumentUpload: boolean
  viewingDocument: boolean
  onSelectDocument: (file: File) => void
  onClearPendingDocument: () => void
  onRemoveExistingDocument: () => void
  onViewDocument: () => void
}

export function PolicyFileField({
  document,
  pendingDocumentName,
  pendingDocumentUpload,
  viewingDocument,
  onSelectDocument,
  onClearPendingDocument,
  onRemoveExistingDocument,
  onViewDocument,
}: PolicyFileFieldProps) {
  const fileInputId = useId()
  const hasSavedDocument = Boolean(document?.path)
  const hasPendingDocument = Boolean(pendingDocumentName)

  return (
    <div className="grid gap-2">
      <Label>Policy file (PDF)</Label>
      <div className="rounded-lg border border-border/60 p-3">
        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) return
            onSelectDocument(file)
            event.currentTarget.value = ""
          }}
        />

        <div className="mb-2 space-y-1">
          {hasPendingDocument ? (
            <>
              <p className="text-sm font-medium text-foreground">{pendingDocumentName}</p>
              <p className="text-xs text-muted-foreground">
                This file will upload when you save the policy.
              </p>
            </>
          ) : hasSavedDocument ? (
            <>
              <p className="text-sm font-medium text-foreground">
                {document?.name || "Policy document"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(document?.size)} · Updated {formatUpdatedAt(document?.updatedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No policy file attached yet.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="h-9" asChild>
            <label htmlFor={fileInputId} className="cursor-pointer">
              <UploadCloud className="h-4 w-4" aria-hidden />
              Choose file
            </label>
          </Button>

          {hasPendingDocument ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9"
              onClick={onClearPendingDocument}
              disabled={pendingDocumentUpload}
            >
              Clear
            </Button>
          ) : null}

          {hasSavedDocument && !hasPendingDocument ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9"
                onClick={onViewDocument}
                disabled={viewingDocument}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {viewingDocument ? "Opening…" : "View file"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9"
                onClick={onRemoveExistingDocument}
                disabled={pendingDocumentUpload}
              >
                Remove file
              </Button>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Only PDF files are supported (15 MB max).
        </p>
      </div>
    </div>
  )
}
