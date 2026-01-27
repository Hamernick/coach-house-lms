import { Empty } from "@/components/ui/empty"
import { ProgramCard } from "@/components/programs/program-card"
import { AcceleratorNextModuleCard } from "@/components/accelerator/accelerator-next-module-card"
import { StartBuildingPager } from "@/components/accelerator/start-building-pager"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { RoadmapOutlineCard } from "@/components/roadmap/roadmap-outline-card"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolveRoadmapSections } from "@/lib/roadmap"

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
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 p-6 lg:p-8">
        <Empty title="Sign in to continue" description="Your accelerator workspace is ready when you are." />
      </div>
    )
  }

  const [profileResult, activeOrg] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>(),
    resolveActiveOrganization(supabase, user.id),
  ])
  const isAdmin = profileResult.data?.role === "admin"

  const [progressSummary, orgResult] = await Promise.all([
    fetchAcceleratorProgressSummary({ supabase, userId: user.id, isAdmin }),
    supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", activeOrg.orgId)
      .maybeSingle<{ profile: Record<string, unknown> | null }>(),
  ])

  const { groups, totalModules, completedModules, inProgressModules, percent } = progressSummary
  const roadmapSections = resolveRoadmapSections(orgResult.data?.profile ?? null)
  const visibleGroups = groups.filter((group) => {
    const title = group.title.trim().toLowerCase()
    const slug = group.slug.trim().toLowerCase()
    return title !== "published class" && slug !== "published-class"
  })
  const safeCompletedModules = Math.min(completedModules, totalModules)
  const progressPercent = percent
  const showProgramBuilder = false
  const nextGroup =
    visibleGroups.find((group) => group.modules.some((module) => module.status !== "completed")) ?? null
  const nextModule =
    nextGroup?.modules.find((module) => module.status !== "completed" && module.status !== "locked") ??
    nextGroup?.modules.find((module) => module.status !== "locked") ??
    nextGroup?.modules[0] ??
    null
  const progressStatus =
    totalModules > 0 && completedModules >= totalModules
      ? "completed"
      : completedModules > 0 || inProgressModules > 0
        ? "in_progress"
        : "not_started"
  const progressSegments = Math.max(1, totalModules)
  const filledSegments =
    progressStatus === "completed"
      ? progressSegments
      : Math.min(safeCompletedModules + (inProgressModules > 0 ? 1 : 0), progressSegments)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 lg:p-8">
      <section id="overview" className="space-y-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-w-0 animate-fade-up flex-col gap-4 lg:h-full">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Welcome</p>
              <h1 className="text-balance text-3xl font-semibold text-foreground sm:text-4xl">
                Idea to Impact Accelerator
              </h1>
              <div className="max-w-[52ch] space-y-2 text-sm text-muted-foreground">
                <p>
                  Welcome to the idea to impact nonprofit accelerator. We built this from 25+ years of experience developing nonprofits to help you build yours.
                </p>
                <p>
                  This is designed to help you rapidly build the core foundations of your organization, step by step, and leave with a clear, sustainable plan to launch, fund, and grow.
                </p>
              </div>
            </div>
            <div className="max-w-sm space-y-2 lg:mt-auto">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Progress</span>
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
            </div>
          </div>

          <div className="flex h-full w-full flex-col gap-6">
            <AcceleratorNextModuleCard module={nextModule} />
          </div>
        </div>

        <RoadmapOutlineCard sections={roadmapSections} />
      </section>

      {visibleGroups.length > 0 ? (
        <section id="curriculum" className="space-y-5">
          <StartBuildingPager groups={visibleGroups} showRailControls={false} />
        </section>
      ) : null}

      {showProgramBuilder ? (
        <section id="roadmap" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Program builder</p>
              <span className="text-xs text-muted-foreground">Templates stay private until published.</span>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            <div className="snap-start shrink-0 w-[min(380px,85vw)] min-h-[480px]">
              <Empty
                className="h-full rounded-3xl border-2 border-dashed border-border/60 bg-surface dark:bg-card/40"
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
                className="snap-start shrink-0 w-[min(380px,85vw)] min-h-[480px]"
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
                  variant="medium"
                  className="h-full bg-surface dark:bg-card"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
