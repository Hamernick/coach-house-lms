"use client"

import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import type {
  VaultDocumentDetail,
  VaultDocumentIndexItem,
} from "./workspace-board-vault-shared"

export function VaultMiniViewerBody({
  selectedItem,
  viewerBusy,
  viewerUrl,
  viewerError,
  detailBusy,
  detail,
  detailError,
}: {
  selectedItem: VaultDocumentIndexItem | null
  viewerBusy: boolean
  viewerUrl: string | null
  viewerError: string | null
  detailBusy: boolean
  detail: VaultDocumentDetail | null
  detailError: string | null
}) {
  const loading = viewerBusy || detailBusy
  const error = viewerError || detailError

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Loading preview…
      </div>
    )
  }

  if (viewerUrl) {
    return (
      <iframe
        src={viewerUrl}
        title={selectedItem ? `Preview for ${selectedItem.title}` : "Document preview"}
        className="h-full w-full border-0"
      />
    )
  }

  if (selectedItem?.source === "roadmap" && detail?.previewType === "roadmap_html") {
    return (
      <article className="h-full w-full overflow-auto px-4 py-3">
        <div
          className="tiptap prose prose-sm dark:prose-invert max-w-none min-h-full break-words"
          dangerouslySetInnerHTML={{ __html: detail.contentHtml ?? "" }}
        />
      </article>
    )
  }

  if (selectedItem?.source === "note" && detail?.previewType === "markdown") {
    return (
      <article className="h-full w-full overflow-auto px-4 py-3">
        <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {detail.contentMarkdown ?? ""}
          </ReactMarkdown>
        </div>
      </article>
    )
  }

  if (error) {
    return <p className="px-4 text-center text-xs text-muted-foreground">{error}</p>
  }

  if (!selectedItem) {
    return <p className="text-xs text-muted-foreground">Pick a result from search to preview.</p>
  }

  if (!selectedItem.href) {
    return <p className="text-xs text-muted-foreground">Preview unavailable for this entry.</p>
  }

  return (
    <p className="px-4 text-center text-xs text-muted-foreground">
      Open this item to view full content.
    </p>
  )
}
