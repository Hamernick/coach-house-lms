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
    <div className="bg-muted/20 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 sm:px-4">
      <p className="text-muted-foreground text-xs">
        {!ready
          ? "Loading saved draft…"
          : storageStatus === "unavailable"
            ? "Browser saving is unavailable. Export before leaving this tab."
            : "Saved in this browser"}
      </p>
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 rounded-full"
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
          className="min-h-11 rounded-full"
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
