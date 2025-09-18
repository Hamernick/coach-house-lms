import { Suspense } from "react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import {
  ChartSkeleton,
  ClassesSkeleton,
  SectionCardsSkeleton,
  SubscriptionStatusSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons"

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      <div className="px-4 lg:px-6">
        <DashboardBreadcrumbs segments={[{ label: "Dashboard" }]} />
      </div>
      <Suspense fallback={<SubscriptionStatusSkeleton />}>
        <SubscriptionStatusSkeleton />
      </Suspense>
      <ClassesSkeleton />
      <SectionCardsSkeleton />
      <ChartSkeleton />
      <TableSkeleton />
    </div>
  )
}
