import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SteppedProgress } from "@/components/ui/stepped-progress"
import { createSupabaseServerClient } from "@/lib/supabase"

type ClassProgress = {
  classId: string
  classTitle: string
  totalModules: number
  completedModules: number
}

async function fetchClassProgressForUser(userId: string): Promise<ClassProgress[]> {
  const supabase = await createSupabaseServerClient()
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("classes ( id, title, slug ), created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  const classes = ((enrollments ?? []) as Array<{ created_at: string; classes: { id: string; title: string | null; slug: string | null } | null }>)
    .map((row) => ({ id: row.classes?.id ?? "", title: row.classes?.title ?? "Untitled Class", slug: row.classes?.slug ?? "" }))
    .filter((c) => c.id && c.slug)

  const results: ClassProgress[] = []
  for (const c of classes) {
    const { data: classRow } = await supabase
      .from("classes")
      .select("id, modules ( id )")
      .eq("id", c.id)
      .maybeSingle<{ id: string; modules: { id: string }[] | null }>()
    const moduleIds = (classRow?.modules ?? []).map((m) => m.id)
    let completed = 0
    if (moduleIds.length > 0) {
      // Module progress completions
      const { data: progress } = await supabase
        .from("module_progress")
        .select("module_id, status")
        .eq("user_id", userId)
        .in("module_id", moduleIds)
      const rows = (progress ?? []) as Array<{ module_id: string; status: string }>
      const completedByProgress = new Set(rows.filter((r) => r.status === "completed").map((r) => r.module_id))

      // Assignment-based completion when complete_on_submit is true and submission not 'revise'
      const { data: assignments } = await supabase
        .from("module_assignments")
        .select("module_id, complete_on_submit")
        .in("module_id", moduleIds)
      const eligibleModules = new Set(((assignments ?? []) as Array<{ module_id: string; complete_on_submit: boolean }>).
        filter((a) => a.complete_on_submit).map((a) => a.module_id))

      let completedByAssignment = new Set<string>()
      if (eligibleModules.size > 0) {
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("module_id, status")
          .eq("user_id", userId)
          .in("module_id", Array.from(eligibleModules))
        const subs = (submissions ?? []) as Array<{ module_id: string; status: 'submitted' | 'accepted' | 'revise' }>
        completedByAssignment = new Set(subs.filter((s) => s.status !== 'revise').map((s) => s.module_id))
      }

      const completedModulesSet = new Set<string>([...completedByProgress, ...completedByAssignment])
      completed = completedModulesSet.size
    }
    results.push({ classId: c.id, classTitle: c.title, totalModules: moduleIds.length, completedModules: completed })
  }

  return results
}

export async function OrgProgressCards({ userId }: { userId: string }) {
  const classProgress = await fetchClassProgressForUser(userId)

  const totalModules = classProgress.reduce((acc, cp) => acc + cp.totalModules, 0)
  const completedModules = classProgress.reduce((acc, cp) => acc + cp.completedModules, 0)
  const classesTotal = classProgress.length
  const classesCompleted = classProgress.filter((cp) => cp.totalModules > 0 && cp.completedModules >= cp.totalModules).length

  // Cards to render: Overall Org Completeness (by training), Classes Completed summary, then per-class progress
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:thin]">
      <div className="flex gap-3 md:gap-4">
        <Card className="min-w-[260px] bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Organization Completeness</CardTitle>
            <CardDescription>Based on training progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <SteppedProgress steps={Math.max(1, Math.min(10, totalModules || 1))} completed={Math.round(((totalModules ? completedModules / totalModules : 0) * Math.max(1, Math.min(10, totalModules || 1))))} />
            <p className="text-xs text-muted-foreground">
              {completedModules}/{totalModules} modules completed
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-[220px] bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Classes</CardTitle>
            <CardDescription>Completed vs total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <SteppedProgress steps={Math.max(1, classesTotal)} completed={classesCompleted} />
            <p className="text-xs text-muted-foreground">
              {classesCompleted}/{classesTotal} classes completed
            </p>
          </CardContent>
        </Card>

        {classProgress.map((cp) => (
          <Card key={cp.classId} className="min-w-[260px] bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="truncate text-base">{cp.classTitle}</CardTitle>
              <CardDescription>Module progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <SteppedProgress steps={Math.max(1, cp.totalModules)} completed={cp.completedModules} />
              <p className="text-xs text-muted-foreground">
                {cp.completedModules}/{cp.totalModules} modules
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
