import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import type { RoadmapHomeworkLink, RoadmapHomeworkStatus } from "@/lib/roadmap"

const ROADMAP_HOMEWORK_TARGETS: Record<
  string,
  Array<{ classSlug: string; moduleSlug?: string; moduleIdx?: number; label: string }>
> = {
  origin_story: [
    {
      classSlug: "strategic-foundations",
      moduleSlug: "start-with-your-why",
      label: "Origin story",
    },
    {
      classSlug: "strategic-foundations",
      moduleIdx: 2,
      label: "Origin story",
    },
  ],
  need: [
    {
      classSlug: "strategic-foundations",
      moduleSlug: "what-is-the-need",
      label: "Need statement",
    },
    {
      classSlug: "strategic-foundations",
      moduleIdx: 3,
      label: "Need statement",
    },
  ],
  mission_vision_values: [
    {
      classSlug: "mission-vision-values",
      moduleSlug: "values",
      label: "Mission, vision, values summary",
    },
    {
      classSlug: "mission-vision-values",
      moduleIdx: 3,
      label: "Mission, vision, values summary",
    },
  ],
  theory_of_change: [
    {
      classSlug: "theory-of-change",
      moduleSlug: "theory-of-change",
      label: "Theory of Change summary",
    },
    {
      classSlug: "theory-of-change",
      moduleIdx: 1,
      label: "Theory of Change summary",
    },
  ],
  program: [
    {
      classSlug: "piloting-programs",
      moduleSlug: "designing-your-pilot",
      label: "Program summary",
    },
    {
      classSlug: "piloting-programs",
      moduleIdx: 3,
      label: "Program summary",
    },
  ],
  evaluation: [
    {
      classSlug: "piloting-programs",
      moduleSlug: "evaluation",
      label: "Evaluation summary",
    },
    {
      classSlug: "piloting-programs",
      moduleIdx: 4,
      label: "Evaluation summary",
    },
  ],
  people: [
    {
      classSlug: "piloting-programs",
      moduleSlug: "designing-your-pilot",
      label: "People & roles",
    },
    {
      classSlug: "piloting-programs",
      moduleIdx: 3,
      label: "People & roles",
    },
  ],
  budget: [
    {
      classSlug: "session-s5-budgets-program",
      moduleSlug: "budgeting-for-a-program",
      label: "Budget summary",
    },
    {
      classSlug: "session-s5-budgets-program",
      moduleIdx: 1,
      label: "Budget summary",
    },
  ],
  fundraising: [
    {
      classSlug: "session-s7-mindset",
      moduleSlug: "channels",
      label: "Fundraising overview",
    },
    {
      classSlug: "session-s7-mindset",
      moduleIdx: 5,
      label: "Fundraising overview",
    },
  ],
  fundraising_strategy: [
    {
      classSlug: "session-s7-mindset",
      moduleSlug: "donor-journey",
      label: "Fundraising strategy & targets",
    },
    {
      classSlug: "session-s7-mindset",
      moduleIdx: 4,
      label: "Fundraising strategy & targets",
    },
  ],
  fundraising_presentation: [
    {
      classSlug: "session-s7-mindset",
      moduleSlug: "storytelling-and-the-ask",
      label: "Fundraising presentation",
    },
    {
      classSlug: "session-s7-mindset",
      moduleIdx: 6,
      label: "Fundraising presentation",
    },
  ],
  fundraising_crm_plan: [
    {
      classSlug: "session-s7-mindset",
      moduleSlug: "treasure-mapping",
      label: "CRM plan & pipeline",
    },
    {
      classSlug: "session-s7-mindset",
      moduleIdx: 3,
      label: "CRM plan & pipeline",
    },
  ],
  communications: [
    {
      classSlug: "session-s8-comms-as-mission",
      moduleSlug: "comprehensive-plan",
      label: "Communications plan",
    },
    {
      classSlug: "session-s8-comms-as-mission",
      moduleIdx: 3,
      label: "Communications plan",
    },
  ],
  board_strategy: [
    {
      classSlug: "session-s9-intro-to-boards",
      moduleSlug: "intro-to-boards",
      label: "Board strategy",
    },
    {
      classSlug: "session-s9-intro-to-boards",
      moduleIdx: 1,
      label: "Board strategy",
    },
  ],
  board_calendar: [
    {
      classSlug: "session-s9-intro-to-boards",
      moduleSlug: "annual-calendar",
      label: "Board calendar",
    },
    {
      classSlug: "session-s9-intro-to-boards",
      moduleIdx: 5,
      label: "Board calendar",
    },
  ],
  board_handbook: [
    {
      classSlug: "session-s9-intro-to-boards",
      moduleSlug: "policy-4-board-self-governance",
      label: "Board handbook",
    },
    {
      classSlug: "session-s9-intro-to-boards",
      moduleIdx: 4,
      label: "Board handbook",
    },
  ],
  next_actions: [
    {
      classSlug: "session-s9-intro-to-boards",
      moduleSlug: "agendas-minutes-resolutions",
      label: "Next actions",
    },
    {
      classSlug: "session-s9-intro-to-boards",
      moduleIdx: 6,
      label: "Next actions",
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
