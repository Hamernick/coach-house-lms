import { Empty } from "@/components/ui/empty"
import { ProgramCard } from "@/components/programs/program-card"
import { AcceleratorOrgSnapshotStrip } from "@/components/accelerator/accelerator-org-snapshot-strip"
import { AcceleratorWelcomeBanner } from "@/components/accelerator/accelerator-welcome-banner"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { RoadmapOutlineCard } from "@/components/roadmap/roadmap-outline-card"
import { AcceleratorOverviewRightRail } from "@/components/accelerator/accelerator-overview-right-rail"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { resolveRoadmapHomework } from "@/lib/roadmap/homework"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolveAcceleratorReadiness } from "@/lib/accelerator/readiness"
import { buildReadinessChecklist } from "@/lib/accelerator/readiness-checklist"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function dedupeModulesById<T extends { id: string }>(modules: T[]) {
  const seen = new Set<string>()
  return modules.filter((module) => {
    if (seen.has(module.id)) return false
    seen.add(module.id)
    return true
  })
}

const CORE_ROADMAP_SECTION_IDS = new Set([
  "origin_story",
  "need",
  "mission_vision_values",
  "theory_of_change",
  "program",
])

export default async function AcceleratorOverviewPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-8 p-6 lg:p-8">
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

  const [progressSummary, orgResult, roadmapHomework, entitlements, programsResult] = await Promise.all([
    fetchAcceleratorProgressSummary({ supabase, userId: user.id, isAdmin }),
    supabase
      .from("organizations")
      .select("profile, public_slug")
      .eq("user_id", activeOrg.orgId)
      .maybeSingle<{ profile: Record<string, unknown> | null; public_slug: string | null }>(),
    resolveRoadmapHomework(user.id, supabase),
    fetchLearningEntitlements({
      supabase,
      userId: user.id,
      orgUserId: activeOrg.orgId,
      isAdmin,
    }),
    supabase
      .from("programs")
      .select("id, goal_cents")
      .eq("user_id", activeOrg.orgId)
      .returns<Array<{ id: string; goal_cents: number | null }>>(),
  ])

  const { groups } = progressSummary
  const roadmapSections = resolveRoadmapSections(orgResult.data?.profile ?? null).map((section) => ({
    ...section,
    homework: roadmapHomework[section.id] ?? null,
  }))
  const ownedElectiveModuleSlugSet = new Set(
    entitlements.ownedElectiveModuleSlugs.map((slug) => slug.trim().toLowerCase()),
  )
  const visibleGroups = (() => {
    const baseGroups = groups.filter((group) => {
      const title = group.title.trim().toLowerCase()
      const slug = group.slug.trim().toLowerCase()
      return title !== "published class" && slug !== "published-class"
    })

    const transformed: Array<(typeof groups)[number]> = []
    let formationTrack: (typeof groups)[number] | null = null
    let electivesTrack: (typeof groups)[number] | null = null

    for (const group of baseGroups) {
      const normalizedSlug = group.slug.trim().toLowerCase()
      const normalizedTitle = group.title.trim().toLowerCase()
      const isFormationSource =
        normalizedSlug === "electives" || normalizedSlug === "formation" || normalizedTitle === "formation"

      if (!isFormationSource) {
        if (entitlements.hasAcceleratorAccess) {
          transformed.push(group)
        }
        continue
      }

      const formationModules = group.modules.filter((module) => !isElectiveAddOnModule(module))
      const electiveModules = group.modules.filter((module) => isElectiveAddOnModule(module))

      if (formationModules.length > 0) {
        const seed =
          formationTrack ??
          ({
            ...group,
            title: "Formation",
            slug: "formation",
            modules: [],
          } satisfies (typeof groups)[number])

        formationTrack = {
          ...seed,
          modules: [...seed.modules, ...formationModules],
        }
      }

      const accessibleElectiveModules = entitlements.hasAcceleratorAccess
        ? electiveModules
        : electiveModules.filter((module) => ownedElectiveModuleSlugSet.has(module.slug.trim().toLowerCase()))

      if (accessibleElectiveModules.length > 0) {
        const seed =
          electivesTrack ??
          ({
            ...group,
            title: "Electives",
            slug: "electives",
            modules: [],
          } satisfies (typeof groups)[number])

        electivesTrack = {
          ...seed,
          modules: [...seed.modules, ...accessibleElectiveModules],
        }
      }
    }

    if (formationTrack) {
      formationTrack = {
        ...formationTrack,
        modules: sortAcceleratorModules(dedupeModulesById(formationTrack.modules)),
      }
    }

    if (electivesTrack) {
      electivesTrack = {
        ...electivesTrack,
        modules: sortAcceleratorModules(dedupeModulesById(electivesTrack.modules)),
      }
    }

    const ordered: Array<(typeof groups)[number]> = []
    if (formationTrack) ordered.push(formationTrack)
    ordered.push(...transformed)
    if (electivesTrack) ordered.push(electivesTrack)
    return ordered.filter((group) => group.modules.length > 0)
  })()
  const timelineModules = visibleGroups.flatMap((group, groupIndex) =>
    group.modules.map((module, moduleIndex) => ({
      ...module,
      groupTitle: group.title,
      sequence: groupIndex * 1000 + moduleIndex,
    })),
  )
  const orgProfile = isRecord(orgResult.data?.profile) ? orgResult.data.profile : {}
  const organizationTitle = String(orgProfile["name"] ?? "").trim()
  const city = String(orgProfile["address_city"] ?? "").trim()
  const state = String(orgProfile["address_state"] ?? "").trim()
  const locationSubtitle = [city, state].filter(Boolean).join(", ")
  const organizationSubtitle = String(orgProfile["tagline"] ?? "").trim() || locationSubtitle || null
  const logoUrl = String(orgProfile["logoUrl"] ?? "").trim() || null
  const headerUrl = String(orgProfile["headerUrl"] ?? "").trim() || null
  const peopleCount = Math.max(1, Array.isArray(orgProfile["org_people"]) ? orgProfile["org_people"].length : 0)
  const programs = programsResult.data ?? []
  const programsCount = programs.length
  const fundingGoalCents = programs.reduce((sum, program) => sum + (program.goal_cents ?? 0), 0)
  const formationStatusRaw = String(orgProfile["formationStatus"] ?? "in_progress")
  const formationLabel =
    formationStatusRaw === "approved"
      ? "Approved"
      : formationStatusRaw === "pre_501c3"
        ? "Pre-501(c)(3)"
        : "In progress"

  const isRoadmapSectionComplete = (section: (typeof roadmapSections)[number]) => {
    if (section.status === "complete") return true
    if (section.content.trim().length > 0) return true
    return section.homework?.status === "complete"
  }

  const roadmapCompletedCount = roadmapSections.filter(isRoadmapSectionComplete).length
  const readiness = resolveAcceleratorReadiness({
    profile: orgProfile,
    modules: visibleGroups.flatMap((group) =>
      group.modules.map((module) => ({
        slug: module.slug,
        status: module.status,
      })),
    ),
    roadmapSections,
    programs,
    peopleCount,
  })
  const readinessStateLabel = readiness.verified ? "Verified" : readiness.fundable ? "Fundable" : "Building"
  const readinessTargetLabel = readiness.verified ? null : readiness.fundable ? "Verified" : "Fundable"
  const formationGroup = visibleGroups.find((group) => group.slug.trim().toLowerCase() === "formation") ?? null
  const nextIncompleteFormationModule =
    formationGroup?.modules.find((module) => module.status !== "completed") ?? formationGroup?.modules[0] ?? null
  const nextCoreRoadmapSection =
    roadmapSections.find((section) => CORE_ROADMAP_SECTION_IDS.has(section.id) && !isRoadmapSectionComplete(section)) ?? null
  const nextCoreRoadmapHref = nextCoreRoadmapSection
    ? `/accelerator/roadmap/${nextCoreRoadmapSection.slug ?? nextCoreRoadmapSection.id}`
    : null
  const readinessChecklist = buildReadinessChecklist({
    reasons: readinessTargetLabel === "Verified" ? readiness.verifiedMissing : readiness.fundableMissing,
    nextFormationModuleHref: nextIncompleteFormationModule?.href,
    nextCoreRoadmapHref,
    maxItems: 3,
  })

  const lessonGroupProgress = visibleGroups.reduce(
    (acc, group) => {
      if (group.modules.length === 0) return acc

      const moduleIds = new Set(group.modules.map((module) => module.id))
      const moduleIndexes = new Set(group.modules.map((module) => module.index))
      const modulesComplete = group.modules.every((module) => module.status === "completed")
      const linkedSections = roadmapSections.filter((section) => {
        const homework = section.homework
        if (!homework) return false
        if (moduleIds.has(homework.moduleId)) return true
        return moduleIndexes.has(homework.moduleIdx)
      })
      const deliverablesComplete = linkedSections.every(isRoadmapSectionComplete)

      return {
        total: acc.total + 1,
        complete: acc.complete + (modulesComplete && deliverablesComplete ? 1 : 0),
      }
    },
    { complete: 0, total: 0 },
  )

  const showProgramBuilder = false
  const nextGroup =
    visibleGroups.find((group) => group.modules.some((module) => module.status !== "completed")) ?? null
  const nextModule =
    nextGroup?.modules.find((module) => module.status !== "completed") ??
    nextGroup?.modules[0] ??
    null
  const continueHref = nextModule?.href ?? "/accelerator"
  const continueModuleLabel = nextModule?.title ?? "Continue in Accelerator"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 lg:p-8">
      <AcceleratorOverviewRightRail
        sections={roadmapSections.map((section) => ({
          id: section.id,
          title: section.title,
          slug: section.slug,
          status: section.status,
        }))}
      />
      <section id="overview" className="space-y-6">
        <AcceleratorWelcomeBanner userId={user.id} />

        <AcceleratorOrgSnapshotStrip
          organizationTitle={organizationTitle}
          organizationSubtitle={organizationSubtitle}
          logoUrl={logoUrl}
          headerUrl={headerUrl}
          fundingGoalCents={fundingGoalCents}
          formationLabel={formationLabel}
          programsCount={programsCount}
          peopleCount={peopleCount}
          progressPercent={readiness.progressPercent}
          deliverablesComplete={roadmapCompletedCount}
          deliverablesTotal={roadmapSections.length}
          moduleGroupsComplete={lessonGroupProgress.complete}
          moduleGroupsTotal={lessonGroupProgress.total}
          fundableCheckpoint={readiness.fundableCheckpoint}
          verifiedCheckpoint={readiness.verifiedCheckpoint}
          readinessStateLabel={readinessStateLabel}
          readinessTargetLabel={readinessTargetLabel}
          readinessChecklist={readinessChecklist}
          continueHref={continueHref}
          continueModuleLabel={continueModuleLabel}
        />

        <RoadmapOutlineCard sections={roadmapSections} modules={timelineModules} />
      </section>

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
