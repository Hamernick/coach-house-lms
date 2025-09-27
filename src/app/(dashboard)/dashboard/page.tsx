import dynamic from "next/dynamic"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { ClassesHighlights } from "@/components/dashboard/classes-overview"
import { NextUpCard } from "@/components/dashboard/next-up-card"
import { ProgressOverview } from "@/components/dashboard/progress-overview"
import { OrganizationsPreview } from "@/components/dashboard/organizations-preview"
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
import { createSupabaseServerClient } from "@/lib/supabase"

const DynamicSectionCards = dynamic(
  () => import("@/components/section-cards").then((mod) => ({ default: mod.SectionCards })),
  {
    loading: () => <SectionCardsSkeleton />,
  }
)

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  return (
    <>
      <section className="px-4 lg:px-6">
        <DashboardBreadcrumbs segments={[{ label: "Dashboard" }]} />
      </section>
      <section className="px-4 lg:px-6">
        <SessionPreview initialSession={session} />
      </section>
      <Suspense fallback={<SubscriptionStatusSkeleton />}>
        <section className="px-4 lg:px-6">
          <SubscriptionStatusCard />
        </section>
      </Suspense>
      <section className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <NextUpCard />
        <ProgressOverview />
      </section>
      <section className="px-4 lg:px-6">
        <OrganizationsPreview />
      </section>
      <Suspense fallback={<ClassesSkeleton />}>
        <section className="px-4 lg:px-6">
          <ClassesHighlights />
        </section>
      </Suspense>
      {/* Below fold – keep existing demo sections for now */}
      <Suspense fallback={<SectionCardsSkeleton />}>
        <section className="px-4 lg:px-6">
          <DynamicSectionCards />
        </section>
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <section className="px-4 lg:px-6">
          <DashboardChartArea />
        </section>
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <section className="px-4 lg:px-6">
          <DynamicDataTable />
        </section>
      </Suspense>
    </>
  )
}
