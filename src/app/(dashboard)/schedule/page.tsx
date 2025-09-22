import { format } from "date-fns"
import { redirect } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const UPCOMING_EVENTS = [
  {
    id: "event-1",
    title: "Live coaching session",
    description: "Join the weekly cohort Q&A to discuss progress.",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24),
    duration: 60,
    type: "Session",
  },
  {
    id: "event-2",
    title: "Module 3 milestone",
    description: "Submit the reflection assignment for Module 3.",
    start: new Date(Date.now() + 1000 * 60 * 60 * 72),
    duration: 0,
    type: "Deadline",
  },
  {
    id: "event-3",
    title: "Peer workshop",
    description: "Collaborative workshop with breakout groups.",
    start: new Date(Date.now() + 1000 * 60 * 60 * 120),
    duration: 90,
    type: "Workshop",
  },
]

export default async function SchedulePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/schedule")
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="px-4 lg:px-6">
        <DashboardBreadcrumbs
          segments={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Schedule" },
          ]}
        />
      </section>
      <section className="space-y-3 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold">Upcoming schedule</h2>
          <p className="text-sm text-muted-foreground">
            Stay on top of live sessions and important deadlines.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {UPCOMING_EVENTS.map((event) => (
            <Card key={event.id} className="border bg-card/60">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {format(event.start, "EEEE, MMM d • h:mm a")}
                  {event.duration > 0 ? ` • ${event.duration} min` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
