import dynamic from "next/dynamic"
import { Suspense } from "react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

import { ClassesHighlights } from "@/components/dashboard/classes-overview"
import { DynamicChartAreaInteractive as DashboardChartArea } from "@/components/dashboard/chart-area-interactive-client"
import { DynamicDataTable } from "@/components/dashboard/data-table-client"
import { SubscriptionStatusCard } from "@/components/dashboard/subscription-status-card"
import {
  ChartSkeleton,
  ClassesSkeleton,
  SectionCardsSkeleton,
  SubscriptionStatusSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons"

import { SessionPreview } from "@/components/session-preview"
import { SiteHeader } from "@/components/site-header"
import { createSupabaseServerClient } from "@/lib/supabase"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const DynamicSectionCards = dynamic(
  () => import("@/components/section-cards").then((mod) => ({ default: mod.SectionCards })),
  {
    loading: () => <SectionCardsSkeleton />,
  }
)





export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
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
              <DynamicSectionCards />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <div className="px-4 lg:px-6">
                <DashboardChartArea />
              </div>
            </Suspense>
            <Suspense fallback={<TableSkeleton />}>
              <div className="px-4 lg:px-6">
                <DynamicDataTable />
              </div>
            </Suspense>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
