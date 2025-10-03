import { Suspense } from "react"

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
