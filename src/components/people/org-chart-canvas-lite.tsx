"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Button } from "@/components/ui/button"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"

const OrgChartCanvas = dynamic(() => import("./org-chart-canvas").then((mod) => mod.OrgChartCanvas), {
  ssr: false,
  loading: () => <OrgChartSkeleton />,
})

export function OrgChartCanvasLite({ people }: { people: OrgPerson[] }) {
  const [showExtras, setShowExtras] = useState(false)

  return (
    <div data-tour="people-org-chart" className="space-y-3">
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
