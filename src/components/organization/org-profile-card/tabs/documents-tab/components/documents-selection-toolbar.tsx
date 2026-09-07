import DownloadIcon from "lucide-react/dist/esm/icons/download"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"

type DocumentsSelectionToolbarProps = {
  count: number
  canDelete: boolean
  canDownload: boolean
  pending: boolean
  onDelete: () => void
  onDownload: () => void
}

export function DocumentsSelectionToolbar({
  count,
  canDelete,
  canDownload,
  pending,
  onDelete,
  onDownload,
}: DocumentsSelectionToolbarProps) {
  return (
    <div
      className="mb-4 flex min-h-11 flex-wrap items-center gap-2"
      role="toolbar"
      aria-label="Selected document actions"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-muted/80 h-11 rounded-full px-4 text-base sm:h-9 sm:px-3 sm:text-sm dark:bg-[#303030]"
        disabled={!canDownload || pending}
        onClick={onDownload}
        aria-label={`Download ${count} selected ${count === 1 ? "document" : "documents"}`}
      >
        <DownloadIcon className="size-4" aria-hidden />
        Download
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-destructive/80 text-destructive hover:bg-destructive/10 hover:text-destructive h-11 rounded-full bg-transparent px-4 text-base sm:h-9 sm:px-3 sm:text-sm"
        disabled={!canDelete || pending}
        onClick={onDelete}
        aria-label={`Delete ${count} selected ${count === 1 ? "document" : "documents"}`}
      >
        <Trash2Icon className="size-4" aria-hidden />
        Delete
      </Button>
      <span
        className="text-muted-foreground ml-auto text-sm tabular-nums"
        aria-live="polite"
      >
        {count} selected
      </span>
    </div>
  )
}
