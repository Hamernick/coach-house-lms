"use client"

import { useId, useRef } from "react"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentDefinition, UploadRow } from "../types"

type UploadRowActionsProps = {
  definition: DocumentDefinition
  document: UploadRow["document"]
  canEdit: boolean
  editMode: boolean
  isUploading: boolean
  isDeleting: boolean
  isViewing: boolean
  onUpload: (definition: DocumentDefinition, file: File) => Promise<void>
  onDelete: (definition: DocumentDefinition) => Promise<void>
  onView: (definition: DocumentDefinition) => Promise<void>
}

export function UploadRowActions({
  definition,
  document,
  canEdit,
  editMode,
  isUploading,
  isDeleting,
  isViewing,
  onUpload,
  onDelete,
  onView,
}: UploadRowActionsProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hasDocument = Boolean(document?.path)
  const menuBusy = isUploading || isDeleting || isViewing

  return (
    <div className="flex min-w-[160px] items-center justify-end gap-2">
      {canEdit && editMode ? (
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (!file) return
            void onUpload(definition, file)
            event.currentTarget.value = ""
          }}
        />
      ) : null}

      {hasDocument ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isViewing}
          onClick={() => void onView(definition)}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {isViewing ? "Opening…" : "View"}
        </Button>
      ) : null}

      {canEdit && editMode ? (
        hasDocument ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={menuBusy}
                aria-label="Document actions"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild disabled={isUploading} className="cursor-pointer">
                <label htmlFor={inputId} className="flex w-full cursor-pointer items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {isUploading ? "Uploading…" : "Replace file"}
                </label>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onSelect={() => void onDelete(definition)}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Removing…" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" aria-hidden />
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        )
      ) : !hasDocument ? (
        <span className="text-xs text-muted-foreground">Admins only</span>
      ) : null}
    </div>
  )
}
