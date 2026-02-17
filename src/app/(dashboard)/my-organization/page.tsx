import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"

import CalendarCheckIcon from "lucide-react/dist/esm/icons/calendar-check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgProfileCard } from "@/components/organization/org-profile-card"
import { ProgramBuilderDashboardCard } from "@/components/organization/program-builder-dashboard-card"
import { MyOrganizationAddEventSheetButton } from "@/components/organization/my-organization-add-event-sheet-button"
import {
  MY_ORGANIZATION_BENTO_GRID_CLASS,
  resolveMyOrganizationBentoCardClass,
} from "@/components/organization/my-organization-bento-rules"
import type { FormationStatus, ProfileTab } from "@/components/organization/org-profile-card/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { fetchAcceleratorProgressSummary, type ModuleCardStatus } from "@/lib/accelerator/progress"
import { sortAcceleratorModules } from "@/lib/accelerator/module-order"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { normalizePersonCategory } from "@/lib/people/categories"
import { resolvePeopleDisplayImages } from "@/lib/people/display-images"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { OrgPerson } from "@/actions/people"
import { cn } from "@/lib/utils"

type UpcomingEvent = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  all_day: boolean
}

const ORG_HEADER_SQUARES: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeDateLabel(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date pending"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date)
}

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
})

function formatFundingGoal(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "Not set"
  return COMPACT_USD.format(cents / 100)
}

function parseMonthParam(value: string) {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null
  const date = new Date(year, month - 1, 1)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1) return null
  return date
}

function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function withMonthParam(
  params: Record<string, string | string[] | undefined> | undefined,
  monthDate: Date,
) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "month") continue
    if (typeof value === "string" && value.trim()) {
      query.set(key, value)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          query.append(key, item)
        }
      }
    }
  }
  query.set("month", formatMonthParam(monthDate))
  return `/organization?${query.toString()}`
}

type FormationStepState = "completed" | "active" | "pending"

function resolveFormationStepState(status: ModuleCardStatus): FormationStepState {
  if (status === "completed") return "completed"
  if (status === "in_progress") return "active"
  return "pending"
}

const DASHBOARD_SUPPORT_CARD_FRAME_CLASS =
  "flex h-full min-w-0 flex-col overflow-hidden min-h-[320px] md:min-h-[340px] xl:min-h-[360px] max-h-[620px]"
const DASHBOARD_SUPPORT_CARD_CONTENT_CLASS = "flex min-h-0 flex-1 flex-col overflow-hidden"

export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const viewParam = typeof resolvedSearchParams?.view === "string" ? resolvedSearchParams.view : ""
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : ""
  const programIdParam = typeof resolvedSearchParams?.programId === "string" ? resolvedSearchParams.programId : ""
  const monthParam = typeof resolvedSearchParams?.month === "string" ? resolvedSearchParams.month : ""
  if (tabParam === "roadmap") redirect("/roadmap")
  if (tabParam === "documents") redirect("/organization/documents")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/organization")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)
  const showEditor = viewParam === "editor" || Boolean(tabParam) || Boolean(programIdParam)

  // Load organization profile for the current user
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile, public_slug, is_public")
    .eq("user_id", orgId)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  const nowIso = new Date().toISOString()

  const [programsResult, upcomingEventsResult, acceleratorProgress, activeSubscriptionResult] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id, title, subtitle, description, location, location_type, location_url, team_ids, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url, wizard_snapshot",
      )
      .eq("user_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("roadmap_calendar_internal_events")
      .select("id,title,starts_at,ends_at,all_day")
      .eq("org_id", orgId)
      .gte("starts_at", nowIso)
      .eq("status", "active")
      .order("starts_at", { ascending: true })
      .limit(5)
      .returns<UpcomingEvent[]>(),
    fetchAcceleratorProgressSummary({
      supabase,
      userId: user.id,
      isAdmin: false,
      basePath: "/accelerator",
    }),
    supabase
      .from("subscriptions")
      .select("status, metadata")
      .eq("user_id", orgId)
      .in("status", ["active", "trialing", "past_due", "incomplete"])
      .not("stripe_subscription_id", "ilike", "stub_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string | null; metadata: Json | null }>(),
  ])
  const programs = programsResult.data
  const upcomingEvents = upcomingEventsResult.data
  const currentPlanTier = resolvePricingPlanTier(activeSubscriptionResult.data ?? null)
  const hasPaidPlan = currentPlanTier !== "free"

  const requestedMonthDate = parseMonthParam(monthParam)
  const calendarAnchorDate = (() => {
    if (requestedMonthDate) return requestedMonthDate
    const first = upcomingEvents?.[0]?.starts_at
    const parsed = first ? new Date(first) : new Date()
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  })()
  const calendarYear = calendarAnchorDate.getFullYear()
  const calendarMonth = calendarAnchorDate.getMonth()
  const calendarMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(calendarAnchorDate)
  const previousMonthDate = new Date(calendarYear, calendarMonth - 1, 1)
  const nextMonthDate = new Date(calendarYear, calendarMonth + 1, 1)
  const previousMonthHref = withMonthParam(resolvedSearchParams, previousMonthDate)
  const nextMonthHref = withMonthParam(resolvedSearchParams, nextMonthDate)
  const previousMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(previousMonthDate)
  const nextMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(nextMonthDate)
  const calendarFirstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const calendarDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const calendarGrid: Array<number | null> = []
  for (let index = 0; index < calendarFirstWeekday; index += 1) {
    calendarGrid.push(null)
  }
  for (let day = 1; day <= calendarDaysInMonth; day += 1) {
    calendarGrid.push(day)
  }
  while (calendarGrid.length % 7 !== 0) {
    calendarGrid.push(null)
  }
  const calendarWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const calendarEventDays = new Set(
    (upcomingEvents ?? [])
      .map((event) => {
        const parsed = new Date(event.starts_at)
        if (Number.isNaN(parsed.getTime())) return null
        if (parsed.getFullYear() !== calendarYear || parsed.getMonth() !== calendarMonth) return null
        return parsed.getDate()
      })
      .filter((value): value is number => typeof value === "number"),
  )
  const nextCalendarEvent = upcomingEvents?.[0] ?? null
  const selectedCalendarDay = (() => {
    if (!nextCalendarEvent) return null
    const parsed = new Date(nextCalendarEvent.starts_at)
    if (Number.isNaN(parsed.getTime())) return null
    if (parsed.getFullYear() !== calendarYear || parsed.getMonth() !== calendarMonth) return null
    return parsed.getDate()
  })()

  const sortedRoadmapModules = sortAcceleratorModules(
    acceleratorProgress.groups.flatMap((group) => group.modules),
  )
  const foundationRoadmapModules = sortedRoadmapModules.filter((module) => !isElectiveAddOnModule(module))
  const acceleratorRoadmapModules = sortedRoadmapModules.filter((module) => isElectiveAddOnModule(module))
  const foundationPreviewModules = foundationRoadmapModules.slice(0, 4)
  const acceleratorPreviewModules = acceleratorRoadmapModules.slice(0, 2)
  const visibleRoadmapModules = hasPaidPlan
    ? [...foundationPreviewModules, ...acceleratorPreviewModules]
    : foundationPreviewModules
  const formationCompletedCount = visibleRoadmapModules.filter((module) => module.status === "completed").length
  const formationProgressPercent =
    visibleRoadmapModules.length > 0
      ? Math.round((formationCompletedCount / visibleRoadmapModules.length) * 100)
      : 0
  const showLaunchRoadmapCard =
    foundationRoadmapModules.length > 0 && foundationRoadmapModules.some((module) => module.status !== "completed")
  const nextFormationModule =
    foundationRoadmapModules.find((module) => module.status !== "completed") ??
    foundationRoadmapModules[0] ??
    null
  const nextFormationHref = nextFormationModule?.href ?? "/accelerator"

  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  const peopleNormalized = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))
  const people = await resolvePeopleDisplayImages(peopleNormalized)

	  const formationStatusRaw = profile["formationStatus"]
	  const isFormationStatus = (value: unknown): value is FormationStatus =>
	    value === "pre_501c3" || value === "in_progress" || value === "approved"
	  const formationStatus: FormationStatus = isFormationStatus(formationStatusRaw) ? formationStatusRaw : "in_progress"

	  const initialProfile = {
	    name: String(profile["name"] ?? ""),
	    description: String(profile["description"] ?? profile["entity"] ?? ""),
	    tagline: String(profile["tagline"] ?? ""),
	    ein: String(orgRow?.ein ?? profile["ein"] ?? ""),
	    formationStatus,
	    rep: String(profile["rep"] ?? ""),
	    email: String(profile["email"] ?? ""),
	    phone: String(profile["phone"] ?? ""),
	    address: String(profile["address"] ?? ""),
	    addressStreet: String(profile["address_street"] ?? ""),
    addressCity: String(profile["address_city"] ?? ""),
    addressState: String(profile["address_state"] ?? ""),
    addressPostal: String(profile["address_postal"] ?? ""),
    addressCountry: String(profile["address_country"] ?? ""),
    logoUrl: String(profile["logoUrl"] ?? ""),
    headerUrl: String(profile["headerUrl"] ?? ""),
    publicUrl: String(profile["publicUrl"] ?? ""),
    twitter: String(profile["twitter"] ?? ""),
    facebook: String(profile["facebook"] ?? ""),
    linkedin: String(profile["linkedin"] ?? ""),
    instagram: String(profile["instagram"] ?? ""),
    youtube: String(profile["youtube"] ?? ""),
    tiktok: String(profile["tiktok"] ?? ""),
    newsletter: String(profile["newsletter"] ?? ""),
    github: String(profile["github"] ?? ""),
    vision: String(profile["vision"] ?? ""),
    mission: String(profile["mission"] ?? ""),
    need: String(profile["need"] ?? ""),
    values: String(profile["values"] ?? ""),
    programs: String(profile["programs"] ?? ""),
    reports: String(profile["reports"] ?? ""),
    boilerplate: String(profile["boilerplate"] ?? ""),
    brandPrimary: String(profile["brandPrimary"] ?? ""),
    brandColors: Array.isArray(profile["brandColors"]) ? (profile["brandColors"] as unknown[]).map((c) => String(c)) : [],
    publicSlug: String(orgRow?.public_slug ?? ""),
    isPublic: publicSharingEnabled ? Boolean(orgRow?.is_public ?? false) : false,
  }

  const allowedTabs: ProfileTab[] = ["company", "programs", "people"]
  const initialTab = allowedTabs.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : undefined
  const programRows = (programs ?? []) as Array<{ goal_cents: number | null }>
  const programsCount = programRows.length
  const fundingGoalCents = programRows.reduce((sum, program) => sum + (program.goal_cents ?? 0), 0)
  const peopleCount = Math.max(1, people.length)
  const organizationTitle = initialProfile.name.trim() || "Organization"
  const locationSubtitle = [initialProfile.addressCity.trim(), initialProfile.addressState.trim()]
    .filter(Boolean)
    .join(", ")
  const organizationSubtitle =
    initialProfile.tagline.trim() ||
    locationSubtitle ||
    ""
  const showTeamCard = false

  if (showEditor) {
    return (
      <div className="flex flex-col gap-5 md:gap-6">
        <PageTutorialButton tutorial="my-organization" />
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Organization editor</h2>
              <p className="text-muted-foreground text-sm">
                Detailed updates across About, Programs, and People.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/organization">Back to workspace</Link>
            </Button>
          </div>
          <OrgProfileCard
            initial={initialProfile}
            people={people}
            programs={programs ?? []}
            initialTab={initialTab}
            initialProgramId={programIdParam || null}
            canEdit={canEdit}
          />
        </section>
        <div aria-hidden className="h-5 shrink-0 md:h-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <PageTutorialButton tutorial="my-organization" />

      <section className={MY_ORGANIZATION_BENTO_GRID_CLASS} data-tour="dashboard-overview">
        <Card
          data-bento-card="profile"
          className={cn(
            resolveMyOrganizationBentoCardClass("profile", { showLaunchRoadmapCard }),
            !showTeamCard && "xl:col-span-6",
            "flex flex-col",
          )}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-xl">Organization</CardTitle>
            {organizationSubtitle ? <CardDescription className="line-clamp-2">{organizationSubtitle}</CardDescription> : null}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 pt-1">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              <div className="relative h-24 overflow-hidden bg-background">
                {initialProfile.headerUrl ? (
                  <Image src={initialProfile.headerUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 480px" className="object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/40" />
                <GridPattern
                  patternId="my-organization-workspace-header-pattern"
                  squares={ORG_HEADER_SQUARES}
                  className={cn(
                    "inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(260px_circle_at_center,white,transparent)]",
                    initialProfile.headerUrl ? "opacity-40" : "opacity-70",
                  )}
                />
              </div>
              <div className="relative px-3 pb-3 pt-8">
                <div className="absolute left-3 top-[-22px] h-12 w-12 overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
                  {initialProfile.logoUrl ? (
                    <Image src={initialProfile.logoUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] font-semibold tracking-wide text-muted-foreground">
                      LOGO
                    </span>
                  )}
                </div>
                <p className="truncate text-base font-semibold text-foreground">{organizationTitle}</p>
                {organizationSubtitle ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{organizationSubtitle}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-background/30 p-1" data-tour="dashboard-stats">
              <Link
                href="/organization?view=editor&tab=programs"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Funding goal</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{formatFundingGoal(fundingGoalCents)}</p>
              </Link>
              <Link
                href="/organization?view=editor&tab=programs"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Programs</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{programsCount}</p>
              </Link>
              <Link
                href="/organization?view=editor&tab=people"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">People</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{peopleCount}</p>
              </Link>
            </div>

            <dl className="divide-y divide-border/50 rounded-lg border border-border/60 bg-background/20 text-sm">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Formation</dt>
                <dd className="font-medium text-right">
                  {initialProfile.formationStatus === "approved"
                    ? "IRS Approved"
                    : initialProfile.formationStatus === "pre_501c3"
                      ? "Pre-501(c)(3)"
                      : "In progress"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Programs</dt>
                <dd className="font-medium tabular-nums">{programs?.length ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Team members</dt>
                <dd className="font-medium tabular-nums">{people.length}</dd>
              </div>
            </dl>
            <div className="mt-auto grid gap-2 pt-1" data-tour="dashboard-actions">
              <Button asChild size="sm" className="h-9 w-full">
                <Link href="/organization?view=editor">Edit organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          data-bento-card="calendar"
          className={cn(
            resolveMyOrganizationBentoCardClass("calendar", { showLaunchRoadmapCard }),
            DASHBOARD_SUPPORT_CARD_FRAME_CLASS,
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheckIcon className="h-4 w-4" aria-hidden />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, "space-y-3")}>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{nextCalendarEvent?.title ?? "No upcoming events"}</p>
              <p className="text-sm text-muted-foreground">
                {nextCalendarEvent
                  ? nextCalendarEvent.all_day
                    ? safeDateLabel(nextCalendarEvent.starts_at)
                    : safeDateLabel(nextCalendarEvent.starts_at, true)
                  : "Add your first internal milestone to populate this view."}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                  <Link href={previousMonthHref} aria-label={`Show ${previousMonthLabel}`}>
                    <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <p className="text-lg font-semibold tracking-tight text-foreground">{calendarMonthLabel}</p>
                <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                  <Link href={nextMonthHref} aria-label={`Show ${nextMonthLabel}`}>
                    <ChevronRightIcon className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {calendarWeekdayLabels.map((label) => (
                  <span key={label} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label.slice(0, 1)}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1">
                {calendarGrid.map((day, index) => {
                  if (!day) {
                    return <span key={`calendar-empty-${index}`} className="aspect-square min-h-7 rounded-md" aria-hidden />
                  }
                  const hasEvent = calendarEventDays.has(day)
                  const isSelected = selectedCalendarDay === day
                  return (
                    <span
                      key={`calendar-day-${day}`}
                      className={cn(
                        "inline-flex aspect-square min-h-7 items-center justify-center rounded-md text-xs font-medium tabular-nums",
                        isSelected
                          ? "bg-foreground text-background"
                          : hasEvent
                            ? "bg-muted text-foreground"
                            : "bg-background/60 text-muted-foreground",
                      )}
                    >
                      {day}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="mt-auto pt-1">
              <MyOrganizationAddEventSheetButton />
            </div>
          </CardContent>
        </Card>

        {showLaunchRoadmapCard ? (
          <Card
            data-bento-card="launch-roadmap"
            className={cn(
              resolveMyOrganizationBentoCardClass("launchRoadmap", { showLaunchRoadmapCard }),
              DASHBOARD_SUPPORT_CARD_FRAME_CLASS,
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RocketIcon className="h-4 w-4" aria-hidden />
                Formation Status
              </CardTitle>
              <CardDescription>Formation milestones and accelerator progress in one view.</CardDescription>
            </CardHeader>
            <CardContent className={cn(DASHBOARD_SUPPORT_CARD_CONTENT_CLASS, "gap-3")}>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {visibleRoadmapModules.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-background/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold tracking-tight text-foreground">Progress</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formationCompletedCount}/{visibleRoadmapModules.length}
                      </p>
                    </div>
                    <Progress value={formationProgressPercent} className="mt-2 h-1.5 bg-muted/70" />

                    <ul className="mt-3 space-y-1.5">
                      {visibleRoadmapModules.map((module, index) => {
                        const stepState = resolveFormationStepState(module.status)
                        const stepCircleClass = cn(
                          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums",
                          stepState === "completed"
                            ? "border-transparent bg-sky-500 text-white"
                            : stepState === "active"
                              ? "border-sky-400 text-sky-600 dark:text-sky-200"
                              : "border-border text-muted-foreground",
                        )
                        const titleClass = cn(
                          "line-clamp-2 text-sm font-medium leading-tight transition",
                          stepState === "completed" && "text-muted-foreground line-through decoration-2",
                          stepState === "pending" && "text-muted-foreground",
                        )

                        return (
                          <li key={module.id}>
                            <Link href={module.href} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-muted/35">
                              <span className={stepCircleClass} aria-hidden>
                                {stepState === "completed" ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                              </span>
                              <span className={cn("min-w-0 flex-1", titleClass)}>{module.title}</span>
                              {stepState === "pending" && isElectiveAddOnModule(module) ? (
                                <span className="shrink-0 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:border-sky-900/50 dark:bg-sky-500/15 dark:text-sky-200">
                                  Optional
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : null}

                {!hasPaidPlan && acceleratorRoadmapModules.length > 0 ? (
                  <p className="rounded-lg border border-border/60 bg-background/20 px-3 py-2 text-xs text-muted-foreground">
                    Unlock {acceleratorRoadmapModules.length} additional accelerator modules with Organization ($20/mo) or
                    Operations Support ($58/mo).
                  </p>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                {formationProgressPercent}% complete
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <Link href="/accelerator">Open accelerator</Link>
                </Button>
                <Button asChild size="sm" className="h-9">
                  <Link href={hasPaidPlan ? nextFormationHref : "/organization?paywall=organization&plan=organization&source=my-org-formation-card"}>
                    {hasPaidPlan ? "Continue" : "Upgrade"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ProgramBuilderDashboardCard
          programs={programs ?? []}
          className={resolveMyOrganizationBentoCardClass("programBuilder", { showLaunchRoadmapCard })}
        />

        {showTeamCard ? (
          <Card
            data-bento-card="team"
            className={resolveMyOrganizationBentoCardClass("team", { showLaunchRoadmapCard })}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersIcon className="h-4 w-4" aria-hidden />
                Team
              </CardTitle>
              <CardDescription>People currently listed on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {people.length > 0 ? (
                <ul className="max-h-56 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border/60 bg-background/20">
                  {people.slice(0, 4).map((person, index) => (
                    <li key={`${person.name}-${index}`} className="px-3 py-2.5">
                      <p className="truncate text-sm font-medium">{person.name || "Unnamed teammate"}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {person.title || person.category || "Role pending"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                  Add teammates to power your org chart and board transparency.
                </p>
              )}
            </CardContent>
            <CardFooter className="mt-auto pt-0">
              <Button asChild variant="outline" size="sm" className="h-9 w-full">
                <Link href="/people">Manage people</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : null}

      </section>
      <div aria-hidden className="h-5 shrink-0 md:h-6" />
    </div>
  )
}
