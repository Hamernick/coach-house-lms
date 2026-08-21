"use client"

import { Button } from "@/components/ui/button"
import { DrawerHandle } from "@/components/ui/drawer"

import {
  resolveNextPublicMapDrawerSnapPointIndex,
  type PublicMapDrawerSnapPointIndex,
} from "./sidebar-snap-points"

export function PublicMapDrawerResizeControl({
  activeSnapIndex,
  onSnapIndexChange,
}: {
  activeSnapIndex: PublicMapDrawerSnapPointIndex
  onSnapIndexChange: (value: PublicMapDrawerSnapPointIndex) => void
}) {
  const nextSnapIndex =
    resolveNextPublicMapDrawerSnapPointIndex(activeSnapIndex)
  const nextSnapLabel = nextSnapIndex === 2 ? "full height" : "middle height"

  return (
    <Button
      type="button"
      variant="ghost"
      data-public-map-drawer-resize-control=""
      className="focus-visible:ring-ring/45 flex h-auto w-full shrink-0 touch-none justify-center rounded-none px-4 pt-3 pb-2 transition-none hover:bg-transparent hover:text-inherit focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-transparent"
      aria-label={`Resize resource map panel to ${nextSnapLabel}`}
      onClick={() => onSnapIndexChange(nextSnapIndex)}
    >
      <DrawerHandle
        className="bg-foreground/18 mt-0 block h-1.5 w-12 rounded-full"
        preventCycle
      />
    </Button>
  )
}
