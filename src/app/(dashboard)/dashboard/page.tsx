import { Suspense } from "react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { DashboardEmptyState } from "@/components/dashboard/empty-state"
import {
  ChartSkeleton,
  SectionCardsSkeleton,
  SubscriptionStatusSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons"
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

async function wait<T>(value: T, ms = 350): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms))
  return value
}

async function AnalyticsOverview() {
  await wait(null, 250)
  return <SectionCards />
}

async function EngagementChart() {
  await wait(null, 350)
  return (
    <div className="px-4 lg:px-6">
      <ChartAreaInteractive />
    </div>
  )
}

async function OpportunitiesTable() {
  const rows = await wait(data, 450)

  if (!rows.length) {
    return (
      <DashboardEmptyState
        title="No classes yet"
        description="Create your first class to populate this activity table."
        actionLabel="Create class"
        onActionHref="/dashboard/classes"
        helperText="Analytics populate automatically once learners enroll."
      />
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <DataTable data={rows} />
    </div>
  )
}

async function AnnouncementsPanel() {
  await wait(null, 500)
  return (
    <DashboardEmptyState
      title="No announcements"
      description="Keep your cohort informed. Share welcome messages or release notes once classes begin."
      actionLabel="Plan announcement"
      onActionHref="/dashboard/classes"
    />
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="px-4 lg:px-6">
        <DashboardBreadcrumbs segments={[{ label: "Dashboard" }]} />
      </div>
      <Suspense fallback={<SubscriptionStatusSkeleton />}>
        <SubscriptionStatusCard />
      </Suspense>
      <Suspense fallback={<SectionCardsSkeleton />}>
        <AnalyticsOverview />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <EngagementChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <OpportunitiesTable />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <AnnouncementsPanel />
      </Suspense>
    </div>
  )
}
