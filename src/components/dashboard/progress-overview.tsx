import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function ProgressOverview() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Find enrolled classes
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("class_id")
    .eq("user_id", user.id)
    .returns<Array<{ class_id: string }>>()

  const classIds = (enrollments ?? []).map((e) => e.class_id)
  if (classIds.length === 0) {
    return (
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>No enrolled classes yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Count published modules across enrolled classes
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .in("class_id", classIds)
    .eq("is_published", true)
    .returns<Array<{ id: string }>>()

  const moduleIds = (modules ?? []).map((m) => m.id)
  const total = moduleIds.length

  let completed = 0
  if (total > 0) {
    const { data: progress } = await supabase
      .from("module_progress")
      .select("id")
      .eq("user_id", user.id)
      .in("module_id", moduleIds)
      .eq("status", "completed")
      .returns<Array<{ id: string }>>()
    completed = (progress ?? []).length
  }

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Progress</CardTitle>
        <CardDescription>
          {completed} of {total} modules completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={pct} aria-label="Overall progress" />
      </CardContent>
    </Card>
  )
}
