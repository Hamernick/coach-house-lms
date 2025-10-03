import { redirect } from "next/navigation"

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

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("created_at, classes ( id, title, slug )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const classes = ((enrollments ?? []) as Array<{
    created_at: string
    classes: { id: string; title: string | null; slug: string | null } | null
  }>)
    .map((e) => ({
      id: e.classes?.id ?? "",
      title: e.classes?.title ?? "Untitled Class",
      slug: e.classes?.slug ?? "",
      enrolledAt: e.created_at,
    }))
    .filter((c) => c.id)

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <section className="grid gap-4 md:grid-cols-2">
        {classes.length === 0 ? (
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>No classmates yet</CardTitle>
              <CardDescription>You aren’t enrolled in any classes.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          classes.map((c) => (
            <Card key={c.id} className="bg-card/60">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>Enrolled {new Date(c.enrolledAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Classmates and mentors will appear here. For now, access your class from the dashboard or Classes page.
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
