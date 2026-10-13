import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { Button } from "@/components/ui/button"

type DeckUnavailableStateProps = {
  isFrame: boolean
  className?: string
  message: string
  loadingUrl: boolean
  onRetry: () => void
}

export function DeckUnavailableState({
  isFrame,
  className,
  message,
  loadingUrl,
  onRetry,
}: DeckUnavailableStateProps) {
  if (isFrame) {
    return (
      <div className={`relative h-full w-full ${className ?? ""}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground">
          <div className="h-10 w-10 rounded-full border border-border/60 bg-muted/50" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Slide deck</p>
            <p>{message}</p>
          </div>
          {!loadingUrl ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto px-0 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Retry <ArrowUpRight className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border/40 bg-muted/50" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Slide deck</p>
          <p className="text-xs text-muted-foreground">{message}</p>
          {!loadingUrl ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto px-0 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Retry <ArrowUpRight className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
