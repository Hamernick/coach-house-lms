import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import type { RoadmapHomeworkLink, RoadmapHomeworkStatus } from "@/lib/roadmap"

const ROADMAP_HOMEWORK_TARGETS: Record<
  string,
  Array<{ classSlug: string; moduleSlug?: string; moduleIdx?: number; label: string }>
> = {
  introduction: [
    {
      classSlug: "strategic-foundations",
      moduleSlug: "start-with-your-why",
      label: "Start with your why",
    },
    {
      classSlug: "strategic-foundations",
      moduleIdx: 2,
      label: "Start with your why",
    },
  ],
  foundations: [
    {
      classSlug: "mission-vision-values",
      moduleSlug: "mission",
      label: "Mission statement",
    },
    {
      classSlug: "mission-vision-values",
      moduleIdx: 1,
      label: "Mission statement",
    },
  ],
  programs_and_pilots: [
    {
      classSlug: "piloting-programs",
      moduleSlug: "designing-your-pilot",
      label: "Designing your pilot",
    },
    {
      classSlug: "program-design-pilot",
      moduleIdx: 2,
      label: "Pilot planning",
    },
  ],
  funding: [
    {
      classSlug: "budgeting-financial-basics",
      moduleSlug: "budgeting-for-a-program",
      label: "Budgeting for a program",
    },
    {
      classSlug: "budgeting-financial-basics",
      moduleIdx: 1,
      label: "Budgeting for a program",
    },
    {
      classSlug: "fundraising-fundamentals",
      moduleIdx: 5,
      label: "Fundraising pipeline",
    },
  ],
  metrics_and_learning: [
    {
      classSlug: "evaluation-data-tracking",
      moduleIdx: 1,
      label: "Evaluation 101",
    },
    {
      classSlug: "evaluation-data-tracking",
      moduleIdx: 5,
      label: "Measures + outcomes",
    },
  ],
  timeline: [
    {
      classSlug: "budgeting-financial-basics",
      moduleSlug: "multi-year-budgeting",
      label: "Multi-year budgeting",
    },
    {
      classSlug: "budgeting-financial-basics",
      moduleIdx: 3,
      label: "Multi-year budgeting",
    },
    {
      classSlug: "theory-of-change",
      moduleSlug: "systems-thinking",
      label: "Systems thinking",
    },
  ],
}

export async function resolveRoadmapHomework(
  userId: string,
  supabase: SupabaseClient<Database, "public">,
): Promise<Record<string, RoadmapHomeworkLink>> {
  const classSlugs = Array.from(
    new Set(
      Object.values(ROADMAP_HOMEWORK_TARGETS)
        .flat()
        .map((target) => target.classSlug),
    ),
  )

  if (classSlugs.length === 0) return {}

  const { data: classRows } = await supabase
    .from("classes")
    .select("id, slug, modules ( id, idx, slug, title )")
    .in("slug", classSlugs)
    .returns<
      Array<{
        id: string
        slug: string
        modules: Array<{ id: string; idx: number; slug: string; title: string | null }> | null
      }>
    >()

  const modulesByClassSlug = new Map<string, Array<{ id: string; idx: number; slug: string; title: string | null }>>()
  for (const row of classRows ?? []) {
    const modules = Array.isArray(row.modules) ? row.modules : []
    modulesByClassSlug.set(row.slug, modules)
  }

  const selected: Array<{ sectionId: string; classSlug: string; module: { id: string; idx: number; slug: string; title: string | null }; label: string }> = []

  for (const [sectionId, targets] of Object.entries(ROADMAP_HOMEWORK_TARGETS)) {
    let matched: { sectionId: string; classSlug: string; module: { id: string; idx: number; slug: string; title: string | null }; label: string } | null = null
    for (const target of targets) {
      const modules = modulesByClassSlug.get(target.classSlug) ?? []
      const moduleMatch = target.moduleSlug
        ? modules.find((item) => item.slug === target.moduleSlug)
        : typeof target.moduleIdx === "number"
          ? modules.find((item) => item.idx === target.moduleIdx)
          : null
      if (moduleMatch) {
        matched = { sectionId, classSlug: target.classSlug, module: moduleMatch, label: target.label }
        break
      }
    }
    if (matched) selected.push(matched)
  }

  if (selected.length === 0) return {}

  const moduleIds = selected.map((entry) => entry.module.id)

  const [progressResult, submissionResult, assignmentResult] = await Promise.all([
    supabase
      .from("module_progress")
      .select("module_id, status")
      .eq("user_id", userId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: string }>>(),
    supabase
      .from("assignment_submissions")
      .select("module_id, status")
      .eq("user_id", userId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: string | null }>>(),
    supabase
      .from("module_assignments")
      .select("module_id, complete_on_submit")
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; complete_on_submit: boolean | null }>>(),
  ])

  const progressMap = new Map<string, string>()
  for (const row of progressResult.data ?? []) {
    progressMap.set(row.module_id, row.status)
  }

  const submissionMap = new Map<string, string>()
  for (const row of submissionResult.data ?? []) {
    if (row.status) submissionMap.set(row.module_id, row.status)
  }

  const completeOnSubmit = new Set(
    (assignmentResult.data ?? [])
      .filter((row) => row.complete_on_submit)
      .map((row) => row.module_id),
  )

  const statusForModule = (moduleId: string): RoadmapHomeworkStatus => {
    const progress = progressMap.get(moduleId)
    if (progress === "completed") return "complete"
    const submission = submissionMap.get(moduleId)
    if (completeOnSubmit.has(moduleId) && submission && submission !== "revise") {
      return "complete"
    }
    if (submission || progress) return "in_progress"
    return "not_started"
  }

  const results: Record<string, RoadmapHomeworkLink> = {}
  for (const entry of selected) {
    results[entry.sectionId] = {
      href: `/accelerator/class/${entry.classSlug}/module/${entry.module.idx}`,
      label: entry.label || entry.module.title || "Homework",
      status: statusForModule(entry.module.id),
      moduleId: entry.module.id,
      moduleTitle: entry.module.title ?? "Module",
      classSlug: entry.classSlug,
      moduleIdx: entry.module.idx,
    }
  }

  return results
}
