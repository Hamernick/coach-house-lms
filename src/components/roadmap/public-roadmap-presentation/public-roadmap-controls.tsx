import { ChevronDown, ChevronUp } from "lucide-react"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { ShareButton } from "@/components/shared/share-button"
import { Button } from "@/components/ui/button"

type PublicRoadmapControlsProps = {
  activeIndex: number
  sectionCount: number
  shareUrl: string
  shareTitle: string
  onGoTo: (nextIndex: number) => void
}

export function PublicRoadmapControls({
  activeIndex,
  sectionCount,
  shareUrl,
  shareTitle,
  onGoTo,
}: PublicRoadmapControlsProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50">
      <div className="flex justify-center">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/80 p-2 shadow-sm backdrop-blur">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-muted/40 hover:text-foreground"
            aria-label="Previous section"
            title="Previous section"
            disabled={activeIndex <= 0}
            onClick={() => onGoTo(activeIndex - 1)}
          >
            <ChevronUp className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-muted/40 hover:text-foreground"
            aria-label="Next section"
            title="Next section"
            disabled={activeIndex >= sectionCount - 1}
            onClick={() => onGoTo(activeIndex + 1)}
          >
            <ChevronDown className="h-5 w-5" aria-hidden />
          </Button>
          <div className="mx-1 h-7 w-px bg-border/60" aria-hidden />
          <ShareButton
            url={shareUrl}
            title={shareTitle}
            icon="link"
            iconOnly
            buttonVariant="ghost"
            buttonSize="icon"
            className="rounded-full hover:bg-muted/40"
          />
          <PublicThemeToggle variant="ghost" className="hover:bg-muted/40" />
        </div>
      </div>
    </div>
  )
}
