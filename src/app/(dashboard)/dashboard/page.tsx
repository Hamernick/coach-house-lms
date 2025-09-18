import dynamic from "next/dynamic"
import { Suspense } from "react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

import { ClassesHighlights } from "@/components/dashboard/classes-overview"
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card"
import {
  ChartSkeleton,
  ClassesSkeleton,
  SectionCardsSkeleton,
  SubscriptionStatusSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons"
const ChartAreaInteractive = dynamic(() => import("@/components/chart-area-interactive"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const DataTable = dynamic(() => import("@/components/data-table"), {
  loading: () => <TableSkeleton />,
})

const SectionCards = dynamic(() => import("@/components/section-cards"), {
  loading: () => <SectionCardsSkeleton />,
})
import { SessionPreview } from "@/components/session-preview"
import { SiteHeader } from "@/components/site-header"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

import data from "./data.json"

async function AnalyticsOverview() {
  return <SectionCards />
}

async function EngagementChart() {
  return (
    <div className="px-4 lg:px-6">
      <ChartAreaInteractive />
    </div>
  )
}

async function OpportunitiesTable() {
  return (
    <div className="px-4 lg:px-6">
      <DataTable data={data} />
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

export default function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col" role="main">
          <div className="flex flex-col gap-6 py-6">
            <div className="px-4 lg:px-6">
              <DashboardBreadcrumbs segments={[{ label: "Dashboard" }]} />
            </div>
            <div className="px-4 lg:px-6">
              <SessionPreview initialSession={session} />
            </div>
            <Suspense fallback={<SubscriptionStatusSkeleton />}>
              <SubscriptionStatusCard />
            </Suspense>
            <Suspense fallback={<ClassesSkeleton />}>
              <ClassesHighlights />
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
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
