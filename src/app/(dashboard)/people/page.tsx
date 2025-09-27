import { redirect } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function PeoplePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) redirect("/login?redirect=/people")

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <section>
        <DashboardBreadcrumbs segments={[{ label: "Dashboard", href: "/dashboard" }, { label: "People" }]} />
      </section>
      <section>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>Your classmates, mentors, and cohort.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

