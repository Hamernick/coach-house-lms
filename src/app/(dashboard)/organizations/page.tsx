import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"

export const dynamic = "force-dynamic"

export default async function OrganizationsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) throw userError
  if (!user) redirect("/login?redirect=/organizations")

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <section>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Organization profile rollups from your latest submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
