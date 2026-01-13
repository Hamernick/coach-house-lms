import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { StartBuildingPager, type ModuleGroup, type ModuleCardStatus } from "@/components/accelerator/start-building-pager"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { ProgramCard } from "@/components/programs/program-card"
import { AcceleratorScheduleCard } from "@/components/accelerator/accelerator-schedule-card"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { fetchSidebarTree } from "@/lib/academy"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const PROGRAM_TEMPLATES = [
  {
    title: "After-school STEM Lab",
    location: "Youth enrichment",
    chips: ["12-week cohort", "STEM mentors", "Pilot ready"],
    patternId: "template-stem",
  },
  {
    title: "Community Health Navigation",
    location: "Public health",
    chips: ["Case management", "Referral network", "Outcomes plan"],
    patternId: "template-health",
  },
]

export default async function AcceleratorOverviewPage() {
  const { groups, totalModules, completedModules, inProgressModules } = await fetchAcceleratorModuleGroups()
  const safeCompletedModules = Math.min(completedModules, totalModules)
  const progressPercent = totalModules > 0 ? Math.round((safeCompletedModules / totalModules) * 100) : 0
  const progressStatus =
    totalModules > 0 && completedModules >= totalModules
      ? "completed"
      : completedModules > 0 || inProgressModules > 0
        ? "in_progress"
        : "not_started"
  const progressCtaLabel = progressStatus === "completed" ? "Complete!" : progressStatus === "in_progress" ? "Continue" : "Start"
  const progressSegments = Math.max(1, totalModules)
  const filledSegments =
    progressStatus === "completed"
      ? progressSegments
      : Math.min(safeCompletedModules + (inProgressModules > 0 ? 1 : 0), progressSegments)

  return (
    <div className="space-y-14">
      <section id="overview" className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-6 animate-fade-up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overview</p>
            <h1 className="text-balance text-3xl font-semibold text-foreground sm:text-4xl">
              Accelerator Progression
            </h1>
            <p className="text-sm text-muted-foreground">
              Build a sustainable nonprofit with a guided control center that turns every step into a publishable plan.
            </p>
            <div className="max-w-sm space-y-3">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Completion</span>
                <span className="text-foreground">{progressPercent}%</span>
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${progressSegments}, minmax(0, 1fr))` }}
                aria-hidden
              >
                {Array.from({ length: progressSegments }).map((_, index) => {
                  const isFilled = index < filledSegments
                  const fillClass =
                    progressStatus === "completed"
                      ? "bg-emerald-500"
                      : progressStatus === "in_progress"
                        ? "bg-amber-500"
                        : "bg-muted/60"
                  return (
                    <span
                      key={`progress-segment-${index}`}
                      className={`h-2 rounded-full ${isFilled ? fillClass : "bg-muted/70"}`}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground">Next up</p>
                  <p className="text-base font-semibold text-foreground">Theory of Change</p>
                </div>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/class/strategic-foundations">
                    {progressCtaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full w-full flex-col">
          <AcceleratorScheduleCard />
        </div>
      </section>

      <section id="progress" className="space-y-4">
        <StartBuildingPager groups={groups} />
      </section>

      <section id="roadmap" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Program builder</p>
            <span className="text-xs text-muted-foreground">Templates stay private until published.</span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          <div className="snap-start shrink-0 w-[260px] sm:w-[300px] lg:w-[340px] h-[420px] sm:h-[480px]">
            <Empty
              className="h-full rounded-3xl border-2 border-dashed border-border/60 bg-card/40"
              title="Create your first program"
              description="Start from scratch or customize a template to reflect real staffing, outcomes, and funding needs."
              actions={<ProgramWizardLazy triggerLabel="Create program" />}
              size="sm"
              variant="subtle"
            />
          </div>
          {PROGRAM_TEMPLATES.map((template) => (
            <div
              key={template.title}
              className="snap-start shrink-0 w-[260px] sm:w-[300px] lg:w-[340px] h-[420px] sm:h-[480px]"
            >
              <ProgramCard
                title={template.title}
                location={template.location}
                statusLabel="Template"
                chips={template.chips}
                ctaLabel="View template"
                ctaHref="/my-organization?tab=programs"
                ctaTarget="_self"
                patternId={template.patternId}
                className="h-full max-w-none"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

async function fetchAcceleratorModuleGroups(): Promise<{
  groups: ModuleGroup[]
  totalModules: number
  completedModules: number
  inProgressModules: number
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0 }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  const isAdmin = profile?.role === "admin"
  const classes = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

  const moduleIds = classes.flatMap((klass) => klass.modules.map((module) => module.id))

  if (moduleIds.length === 0) {
    return { groups: [], totalModules: 0, completedModules: 0, inProgressModules: 0 }
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("module_progress")
    .select("module_id, status")
    .eq("user_id", user.id)
    .in("module_id", moduleIds)
    .returns<Array<{ module_id: string; status: ModuleCardStatus }>>()

  if (progressError) {
    throw progressError
  }

  const progressMap = new Map<string, ModuleCardStatus>()
  let completedModules = 0
  let inProgressModules = 0

  for (const row of progressRows ?? []) {
    const status = row.status
    progressMap.set(row.module_id, status)
    if (status === "completed") completedModules += 1
    if (status === "in_progress") inProgressModules += 1
  }

  const groups: ModuleGroup[] = classes.map((klass) => {
    let unlocked = true
    const modules = klass.modules.map((module) => {
      const statusFromProgress = progressMap.get(module.id) ?? "not_started"
      let status: ModuleCardStatus = statusFromProgress
      if (!unlocked) {
        status = "locked"
      }
      if (unlocked && statusFromProgress === "not_started") {
        unlocked = false
      }
      return {
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        href: `/accelerator/class/${klass.slug}/module/${module.index}`,
        status,
        index: module.index,
      }
    })

    return {
      id: klass.id,
      title: klass.title,
      description: klass.description ?? null,
      modules,
    }
  }).filter((group) => group.modules.length > 0)

  return {
    groups,
    totalModules: moduleIds.length,
    completedModules,
    inProgressModules,
  }
}
