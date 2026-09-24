"use client"

import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import { Button } from "@/components/ui/button"

export function DocumentationDraftToolbar({
  ready,
  storageStatus,
  hasChanges,
  onLoadExample,
  onReset,
}: {
  ready: boolean
  storageStatus?: "loading" | "saved" | "unavailable"
  hasChanges: boolean
  onLoadExample: () => void
  onReset: () => void
}) {
  return (
    <div className="border-border/50 flex flex-wrap items-center justify-between gap-2 border-b px-5 py-2 sm:px-6">
      <p className="text-muted-foreground text-xs">
        {!ready
          ? "Loading saved draft…"
          : storageStatus === "unavailable"
            ? "Browser saving is unavailable. Export your latest changes before leaving."
            : "Saved in this browser"}
      </p>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 rounded-full text-xs"
          disabled={!ready}
          onClick={() => {
            if (
              hasChanges &&
              !window.confirm(
                "Replace this draft with the example? Your current draft will be overwritten."
              )
            )
              return
            onLoadExample()
          }}
        >
          Load example
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 rounded-full text-xs"
          disabled={!ready}
          onClick={onReset}
        >
          <RotateCcwIcon aria-hidden />
          Reset
        </Button>
      </div>
    </div>
  )
}
