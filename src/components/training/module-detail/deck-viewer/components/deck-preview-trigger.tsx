import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { Button } from "@/components/ui/button"

type DeckPreviewTriggerProps = {
  isFrame: boolean
  className?: string
  pageCount: number | null
  preview: React.ReactNode
  openExternally: boolean
  deckUrl: string
}

export function DeckPreviewTrigger({
  isFrame,
  className,
  pageCount,
  preview,
  openExternally,
  deckUrl,
}: DeckPreviewTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={`group relative h-auto w-full justify-start whitespace-normal p-0 text-left transition ${
        isFrame
          ? "h-full overflow-hidden rounded-2xl"
          : "rounded-2xl border border-border/40 bg-card/80 px-3 py-2.5 shadow-sm hover:bg-card/80 hover:shadow-md"
      } ${className ?? ""}`}
      onClick={
        openExternally && deckUrl
          ? (event) => {
              event.preventDefault()
              window.open(deckUrl, "_blank", "noopener")
            }
          : undefined
      }
      disabled={openExternally && !deckUrl}
    >
      <div className={`flex flex-col gap-1.5 ${isFrame ? "h-full" : ""}`}>
        {preview}
        {!isFrame ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Slide deck</p>
            <p className="text-xs text-muted-foreground">
              {pageCount
                ? `${pageCount} slides · Open the full PDF for details.`
                : "Open the full PDF for details."}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition group-hover:text-foreground">
              Open full deck <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        ) : null}
      </div>
    </Button>
  )
}
