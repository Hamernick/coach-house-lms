import Link from "next/link"
import { redirect } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PaginationControls } from "@/components/dashboard/pagination-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listClasses } from "@/lib/classes"
import { createSupabaseServerClient } from "@/lib/supabase"

const PAGE_SIZE = 12

export const dynamic = "force-dynamic"

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/classes")
  }

  const pageParam = typeof params?.page === "string" ? Number.parseInt(params.page, 10) : NaN
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const classesResult = await listClasses({ page, pageSize: PAGE_SIZE })

  return (
    <div className="flex flex-col gap-6">
      <section className="px-4 lg:px-6">
        <DashboardBreadcrumbs
          segments={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Classes" },
          ]}
        />
      </section>
      <section className="space-y-3 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold">Your classes</h2>
          <p className="text-sm text-muted-foreground">
            Continue learning or explore new content below.
          </p>
        </div>
        {classesResult.items.length === 0 ? (
          <Card className="border-dashed bg-muted/40">
            <CardHeader>
              <CardTitle>No classes yet</CardTitle>
              <CardDescription>
                You’re not enrolled in any classes yet. Visit the catalog or reach out to your admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classesResult.items.map((item) => (
                <Card key={item.id} className="border bg-card/60">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {item.description ?? "Stay on track with this learning path."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{item.moduleCount} modules</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/class/${item.slug}/module/1`}>Go to class</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PaginationControls
              page={classesResult.page}
              pageSize={classesResult.pageSize}
              total={classesResult.total}
              basePath="/classes"
            />
          </>
        )}
      </section>
    </div>
  )
}
