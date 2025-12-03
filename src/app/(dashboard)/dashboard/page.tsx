import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrgProgressCards } from "@/components/organization/org-progress-cards"
import { RoadmapAnalyticsSummaryCard } from "@/components/roadmap/roadmap-analytics-summary"
import { RoadmapAnalyticsChart } from "@/components/roadmap/roadmap-analytics-chart"
import { fetchRoadmapAnalyticsSummary } from "@/lib/roadmap/analytics"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/dashboard")
  const analyticsSummary = await fetchRoadmapAnalyticsSummary()
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] auto-rows-min">
      <div className="space-y-4">
        <Card className="min-h-[150px]">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>Quick wins to move forward</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span>Review Strategic Foundations assignments</span>
              <Badge variant="secondary">3 due</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span>Check new enrollments</span>
              <Badge variant="outline">12</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="min-h-[210px]">
          <CardHeader>
            <CardTitle>Backlog</CardTitle>
            <CardDescription>Ideas and tasks not yet scheduled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
              Drop in upcoming content updates, experiments, or outreach tasks you don&apos;t want to forget.
            </p>
            <div className="grid gap-2 text-sm">
              <div className="rounded-md bg-muted/40 px-3 py-2">Draft &quot;Q2 Fundraising&quot; module</div>
              <div className="rounded-md bg-muted/40 px-3 py-2">Collect testimonials from pilot programs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <Card className="border-dashed bg-muted/40">
          <CardHeader className="pb-3">
            <CardTitle>Progress at a glance</CardTitle>
            <CardDescription>How your classes and modules are tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrgProgressCards userId={user.id} />
          </CardContent>
        </Card>
        <RoadmapAnalyticsSummaryCard summary={analyticsSummary} />
        <RoadmapAnalyticsChart summary={analyticsSummary} />
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Program at a glance</CardTitle>
            <CardDescription>High‑level view of learner progress</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center">
            <div className="aspect-[5/4] w-full max-w-xl rounded-2xl border border-dashed border-border/70 bg-muted/40 shadow-sm">
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-semibold tracking-tight text-muted-foreground">42</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        <Card className="min-h-[150px]">
          <CardHeader>
            <CardTitle>In progress</CardTitle>
            <CardDescription>Work actively happening this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md bg-muted/40 px-3 py-2">Mission, Vision &amp; Values cohort</div>
            <div className="rounded-md bg-muted/40 px-3 py-2">Theory of Change workshop</div>
          </CardContent>
        </Card>
        <Card className="min-h-[210px]">
          <CardHeader>
            <CardTitle>Done</CardTitle>
            <CardDescription>Recently completed items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md bg-muted/40 px-3 py-2">Piloting Programs orientation</div>
            <div className="rounded-md bg-muted/40 px-3 py-2">Onboarding checklist</div>
            <div className="rounded-md bg-muted/40 px-3 py-2">October supporter update</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
