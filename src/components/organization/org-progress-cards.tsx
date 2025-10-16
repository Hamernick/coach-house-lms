import { SteppedProgress } from "@/components/ui/stepped-progress"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from "@/components/ui/item"
import Link from "next/link"
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

  // Determine the next actionable module across all enrolled classes
  const supabase = await createSupabaseServerClient()
  const { data: nextModuleId } = await supabase.rpc("next_unlocked_module", { p_user_id: userId })
  let nextAction:
    | { classSlug: string; classTitle: string; moduleIdx: number; moduleTitle: string }
    | null = null
  if (nextModuleId) {
    const { data: mod } = await supabase
      .from("modules")
      .select("id, idx, title, class_id")
      .eq("id", nextModuleId as string)
      .maybeSingle<{ id: string; idx: number; title: string | null; class_id: string }>()
    if (mod) {
      const { data: klass } = await supabase
        .from("classes")
        .select("id, slug, title")
        .eq("id", mod.class_id)
        .maybeSingle<{ id: string; slug: string; title: string | null }>()
      if (klass) {
        nextAction = {
          classSlug: klass.slug,
          classTitle: klass.title ?? "Class",
          moduleIdx: mod.idx,
          moduleTitle: mod.title ?? "Module",
        }
      }
    }
  }

  const totalModules = classProgress.reduce((acc, cp) => acc + cp.totalModules, 0)
  const completedModules = classProgress.reduce((acc, cp) => acc + cp.completedModules, 0)
  const classesTotal = classProgress.length
  const classesCompleted = classProgress.filter((cp) => cp.totalModules > 0 && cp.completedModules >= cp.totalModules).length

  // Cards to render: Overall Org Completeness (by training), Classes Completed summary, then per-class progress
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 md:gap-4">
        {/* Organization completeness as Item */}
        <Item className="w-full">
          <ItemContent>
            <ItemTitle>Organization Completeness</ItemTitle>
            <ItemDescription>Academy progression</ItemDescription>
            <ItemFooter>
              <SteppedProgress
                size="sm"
                steps={Math.max(1, Math.min(10, totalModules || 1))}
                completed={Math.round((totalModules ? (completedModules / totalModules) : 0) * Math.max(1, Math.min(10, totalModules || 1)))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Modules {completedModules}/{totalModules}
                {" · "}
                Classes {classesCompleted}/{classesTotal}
              </p>
            </ItemFooter>
          </ItemContent>
        </Item>

        {/* Classes action as Item */}
        <Item className="w-full">
          <ItemContent>
            <ItemTitle>Your Next Class</ItemTitle>
            {nextAction ? (
              <>
                <ItemDescription className="truncate">{nextAction.classTitle}</ItemDescription>
                <p className="truncate text-xs text-muted-foreground">Module {nextAction.moduleIdx}: {nextAction.moduleTitle}</p>
              </>
            ) : (
              <ItemDescription>All caught up — no pending modules</ItemDescription>
            )}
          </ItemContent>
          <ItemActions>
            {nextAction ? (
              <Button asChild size="sm">
                <Link prefetch href={`/class/${nextAction.classSlug}/module/${nextAction.moduleIdx}`}>
                  Resume
                </Link>
              </Button>
            ) : null}
          </ItemActions>
        </Item>

        {classProgress.map((cp) => (
          <Item key={cp.classId} className="w-full">
            <ItemContent>
              <ItemTitle className="truncate">{cp.classTitle}</ItemTitle>
              <ItemDescription>Module progress</ItemDescription>
              <ItemFooter>
                <SteppedProgress size="sm" steps={Math.max(1, cp.totalModules)} completed={cp.completedModules} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {cp.completedModules}/{cp.totalModules} modules
                </p>
              </ItemFooter>
            </ItemContent>
          </Item>
        ))}
    </div>
  )
}
