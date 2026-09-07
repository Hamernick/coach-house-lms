"use client"

import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"
import { Button } from "@/components/ui/button"
import { useMarketplaceShortlist } from "../../hooks/use-marketplace-shortlist"
import { MarketplaceShortlist } from "./marketplace-shortlist"

export function MarketplaceResourceActions({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const shortlist = useMarketplaceShortlist()
  const selected = shortlist.ids.includes(id)
  const full = !selected && shortlist.ids.length >= 20
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-full"
          disabled={!shortlist.ready || full}
          aria-pressed={selected}
          aria-label={`${selected ? "Remove" : "Save"} ${name}${selected ? " from saved resources" : ""}`}
          onClick={() => shortlist.toggle(id)}
        >
          <BookmarkIcon
            className={selected ? "fill-current" : undefined}
            aria-hidden
          />
          {selected ? "Saved" : "Save resource"}
        </Button>
        {!shortlist.persistent ? (
          <p role="status" className="text-muted-foreground text-xs">
            Browser saving is unavailable. Export your list before leaving this
            tab.
          </p>
        ) : null}
        <MarketplaceShortlist
          resources={shortlist.resources}
          ready={shortlist.ready}
          persistent={shortlist.persistent}
          onClear={shortlist.clear}
          onDownload={shortlist.download}
        />
      </div>
      {full ? (
        <p role="status" className="text-muted-foreground text-xs">
          Your saved list holds 20 resources. Remove one to save another.
        </p>
      ) : null}
    </div>
  )
}
