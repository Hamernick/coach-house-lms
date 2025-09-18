import { Suspense } from "react"

import { ClassesList } from "@/components/dashboard/classes-list"
import { PaginationControls } from "@/components/dashboard/pagination-controls"
import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { TableSkeleton } from "@/components/dashboard/skeletons"
import { listClasses } from "@/lib/classes"

const PAGE_SIZE = 8

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const pageParam = params?.page
  const parsedPage = typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : NaN
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <DashboardBreadcrumbs segments={[{ label: "Dashboard", href: "/dashboard" }, { label: "Classes" }]} />
      <Suspense fallback={<TableSkeleton />}>
                <ClassesSection page={page} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  )
}

async function ClassesSection({
  page,
  pageSize,
}: {
  page: number
  pageSize: number
}) {
  const result = await listClasses({ page, pageSize })

  return (
    <>
      <ClassesList items={result.items} />
      <PaginationControls page={result.page} pageSize={result.pageSize} total={result.total} />
    </>
  )
}
