import { Suspense } from "react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminKpis, fetchRecentEnrollments, fetchRecentPayments } from "@/lib/admin/kpis"
import { formatCurrency } from "@/lib/format"

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="bg-card/60">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton({ title }: { title: string }) {
  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-40" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function KpiSection() {
  const kpis = await fetchAdminKpis()
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Total students</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{kpis.totalStudents.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Active subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{kpis.activeSubscriptions.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Revenue (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">
            {formatCurrency(kpis.thirtyDayRevenue / 100, kpis.revenueCurrency)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentEnrollments() {
  const enrollments = await fetchRecentEnrollments()
  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Recent enrollments</CardTitle>
        <CardDescription>Latest learners joining classes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments recorded yet.</p>
        ) : (
          enrollments.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{entry.classTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.userEmail} · {new Date(entry.enrolledAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

async function RecentPayments() {
  const payments = await fetchRecentPayments()
  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Recent payments</CardTitle>
        <CardDescription>Latest successful charges and renewals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">
                  {formatCurrency(payment.amount / 100, payment.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.status.replace(/_/g, " ")} ·{" "}
                  {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardBreadcrumbs segments={[{ label: "Admin" }, { label: "Dashboard" }]} />
      <Suspense fallback={<KpiSkeleton />}>
        {/* @ts-expect-error Async Server Component */}
        <KpiSection />
      </Suspense>
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ListSkeleton title="Recent enrollments" />}>
          {/* @ts-expect-error Async Server Component */}
          <RecentEnrollments />
        </Suspense>
        <Suspense fallback={<ListSkeleton title="Recent payments" />}>
          {/* @ts-expect-error Async Server Component */}
          <RecentPayments />
        </Suspense>
      </div>
    </div>
  )
}
