"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

import type { OrgPerson } from "@/actions/people"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"

const OrgChartCanvas = dynamic(() => import("./org-chart-canvas").then((mod) => mod.OrgChartCanvas), {
  ssr: false,
  loading: () => <OrgChartSkeleton />,
})

export function OrgChartCanvasLite({ people, canEdit = true }: { people: OrgPerson[]; canEdit?: boolean }) {
  return (
    <div data-tour="people-org-chart" className="space-y-3">
      <Suspense fallback={<OrgChartSkeleton />}>
        <OrgChartCanvas people={people} extras={false} canEdit={canEdit} />
      </Suspense>
    </div>
  )
}
