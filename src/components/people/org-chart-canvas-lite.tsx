"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"
import NetworkIcon from "lucide-react/dist/esm/icons/network"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Button } from "@/components/ui/button"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"

const OrgChartCanvas = dynamic(() => import("./org-chart-canvas").then((mod) => mod.OrgChartCanvas), {
  ssr: false,
  loading: () => <OrgChartSkeleton />,
})

export function OrgChartCanvasLite({ people }: { people: OrgPerson[] }) {
  const [showCanvas, setShowCanvas] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  if (!showCanvas) {
    return (
      <div className="flex w-full justify-start">
        <div className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-4 text-sm text-muted-foreground shadow-sm sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-inner">
              <NetworkIcon className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-semibold leading-tight text-foreground">Organization chart</p>
              <p className="text-xs sm:text-sm">
                Open the canvas to quickly see reporting lines without scrolling the whole directory.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCanvas(true)} size="sm" className="self-start sm:self-auto">
            Open chart
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end px-4 pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowExtras((value) => !value)}
        >
          {showExtras ? "Hide" : "Show"} map details
        </Button>
      </div>
      <Suspense fallback={<OrgChartSkeleton />}>
        <OrgChartCanvas people={people} extras={showExtras} />
      </Suspense>
    </div>
  )
}
