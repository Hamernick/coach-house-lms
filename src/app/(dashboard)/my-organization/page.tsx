import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"

import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import BellIcon from "lucide-react/dist/esm/icons/bell"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import CalendarCheckIcon from "lucide-react/dist/esm/icons/calendar-check"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgProfileCard } from "@/components/organization/org-profile-card"
import { ProgramBuilderDashboardCard } from "@/components/organization/program-builder-dashboard-card"
import {
  MY_ORGANIZATION_BENTO_CARD_RULES,
  MY_ORGANIZATION_BENTO_GRID_CLASS,
  resolveMyOrganizationBentoCardClass,
} from "@/components/organization/my-organization-bento-rules"
import type { FormationStatus, ProfileTab } from "@/components/organization/org-profile-card/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { fetchAcceleratorProgressSummary, type ModuleCardStatus } from "@/lib/accelerator/progress"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { normalizePersonCategory } from "@/lib/people/categories"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { OrgPerson } from "@/actions/people"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type NotificationPreview = {
  id: string
  title: string
  description: string
  href: string | null
  tone: "warning" | "info" | "success" | null
  read_at: string | null
  created_at: string
}

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

function completionPercent(fields: string[]) {
  if (fields.length === 0) return 0
  const completed = fields.filter((value) => value.trim().length > 0).length
  return Math.round((completed / fields.length) * 100)
}

function activityBadge(item: NotificationPreview) {
  if (!item.read_at) {
    return {
      label: "New",
      className:
        "rounded-full border border-emerald-200 bg-emerald-100 text-[10px] font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/15 dark:text-emerald-200",
    }
  }

  if (item.tone === "warning") {
    return {
      label: "Attention",
      className:
        "rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
    }
  }

  if (item.tone === "success") {
    return {
      label: "Done",
      className:
        "rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
    }
  }

  return {
    label: "Read",
    className:
      "rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  }
}

function formationModuleStatusLabel(status: ModuleCardStatus) {
  if (status === "completed") return "Complete"
  if (status === "in_progress") return "In progress"
  return "Not started"
}

function formationModuleStatusClass(status: ModuleCardStatus) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/15 dark:text-emerald-200"
  }
  if (status === "in_progress") {
    return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/50 dark:bg-amber-500/15 dark:text-amber-200"
  }
  return "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
}

function formationModuleStatusIcon(status: ModuleCardStatus) {
  if (status === "completed") return <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
  if (status === "in_progress") return <CircleDotIcon className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-hidden />
  return <CircleIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
}

export default async function MyOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const viewParam = typeof resolvedSearchParams?.view === "string" ? resolvedSearchParams.view : ""
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : ""
  const programIdParam = typeof resolvedSearchParams?.programId === "string" ? resolvedSearchParams.programId : ""
  const readNotificationParam =
    typeof resolvedSearchParams?.readNotification === "string" ? resolvedSearchParams.readNotification.trim() : ""
  const nextParam = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next.trim() : ""
  if (tabParam === "roadmap") redirect("/roadmap")
  if (tabParam === "documents") redirect("/my-organization/documents")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/my-organization")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)
  const showEditor = viewParam === "editor" || Boolean(tabParam) || Boolean(programIdParam)

  if (readNotificationParam) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", readNotificationParam)
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .is("archived_at", null)
      .is("read_at", null)

    const safeNextHref = nextParam.startsWith("/") ? nextParam : "/my-organization"
    redirect(safeNextHref)
  }

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

  // Load programs for this organization (by user)
  const { data: programs } = await supabase
    .from("programs")
    .select(
      "id, title, subtitle, description, location, location_type, location_url, team_ids, image_url, duration_label, features, status_label, goal_cents, raised_cents, is_public, created_at, start_date, end_date, address_city, address_state, address_country, cta_label, cta_url, wizard_snapshot",
    )
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  const nowIso = new Date().toISOString()
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,description,href,tone,read_at,created_at")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<NotificationPreview[]>()

  const { data: upcomingEvents } = await supabase
    .from("roadmap_calendar_internal_events")
    .select("id,title,starts_at,ends_at,all_day")
    .eq("org_id", orgId)
    .gte("starts_at", nowIso)
    .eq("status", "active")
    .order("starts_at", { ascending: true })
    .limit(5)
    .returns<UpcomingEvent[]>()

  const calendarAnchorDate = (() => {
    const first = upcomingEvents?.[0]?.starts_at
    const parsed = first ? new Date(first) : new Date()
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  })()
  const calendarYear = calendarAnchorDate.getFullYear()
  const calendarMonth = calendarAnchorDate.getMonth()
  const calendarMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(calendarAnchorDate)
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
  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"

  const acceleratorProgress = await fetchAcceleratorProgressSummary({
    supabase,
    userId: user.id,
    isAdmin: false,
    basePath: "/accelerator",
  })

  const formationGroup =
    acceleratorProgress.groups.find((group) => group.title.trim().toLowerCase() === "formation") ??
    acceleratorProgress.groups.find((group) => group.slug.trim().toLowerCase() === "electives") ??
    acceleratorProgress.groups[0] ??
    null
  const formationPreviewModules = formationGroup?.modules.slice(0, 3) ?? []
  const formationCompletedCount = formationPreviewModules.filter((module) => module.status === "completed").length
  const showLaunchRoadmapCard =
    formationPreviewModules.length > 0 && formationCompletedCount < formationPreviewModules.length
  const nextFormationModule =
    formationPreviewModules.find((module) => module.status !== "completed") ??
    formationPreviewModules[0] ??
    null
  const nextFormationHref = nextFormationModule?.href ?? "/accelerator"

  const peopleRaw = (Array.isArray(profile.org_people) ? profile.org_people : []) as OrgPerson[]
  const peopleNormalized = peopleRaw.map((person) => ({
    ...person,
    category: normalizePersonCategory(person.category),
  }))
  let people: (OrgPerson & { displayImage: string | null })[] = []
  try {
    const admin = createSupabaseAdminClient()
    for (const p of peopleNormalized) {
      let displayImage: string | null = null
      if (p.image) {
        if (/^https?:/i.test(p.image) || p.image.startsWith("data:")) {
          displayImage = p.image
        } else {
          const { data: signed } = await admin.storage.from("avatars").createSignedUrl(p.image, 60 * 60)
          displayImage = signed?.signedUrl ?? null
        }
      }
      people.push({ ...p, displayImage })
    }
	  } catch {
	    people = peopleNormalized.map((p) => ({
	      ...p,
	      displayImage: /^https?:/i.test(p.image ?? "") ? (p.image as string) : null,
	    }))
	  }

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
  const profileCompletion = completionPercent([
    initialProfile.name,
    initialProfile.tagline,
    initialProfile.description,
    initialProfile.mission,
    initialProfile.need,
    initialProfile.programs,
    initialProfile.email,
    initialProfile.phone,
    initialProfile.addressCity,
    initialProfile.addressState,
  ])
  const aboutCompletion = completionPercent([
    initialProfile.name,
    initialProfile.tagline,
    initialProfile.description,
    initialProfile.mission,
    initialProfile.need,
    initialProfile.addressCity,
    initialProfile.addressState,
  ])
  const programCompletion = programs && programs.length > 0 ? 100 : 0
  const peopleCompletion = people.length > 0 ? 100 : 0
  const organizationTitle = initialProfile.name.trim() || "Organization"
  const locationSubtitle = [initialProfile.addressCity.trim(), initialProfile.addressState.trim()]
    .filter(Boolean)
    .join(", ")
  const organizationSubtitle =
    initialProfile.tagline.trim() ||
    locationSubtitle ||
    ""
  const continueInAcceleratorLabel = nextFormationModule
    ? `Continue - Lesson ${nextFormationModule.index}`
    : "Continue in Accelerator"

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
              <Link href="/my-organization">Back to workspace</Link>
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

      <section className={MY_ORGANIZATION_BENTO_GRID_CLASS}>
        <Card
          data-bento-card="profile"
          className={cn(
            resolveMyOrganizationBentoCardClass("profile", { showLaunchRoadmapCard }),
            "flex flex-col",
          )}
        >
          <CardHeader className="pb-1">
            <div className="flex items-center justify-end gap-2">
              <Badge
                variant="outline"
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px]"
              >
                {profileCompletion}% complete
              </Badge>
            </div>
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

            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-background/30 p-1">
              <Link
                href="/my-organization?view=editor&tab=company"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">About</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{aboutCompletion}%</p>
              </Link>
              <Link
                href="/my-organization?view=editor&tab=programs"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Programs</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{programCompletion}%</p>
              </Link>
              <Link
                href="/my-organization?view=editor&tab=people"
                className="rounded-md px-2 py-2 transition hover:bg-muted/40"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">People</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{peopleCompletion}%</p>
              </Link>
            </div>

            <dl className="divide-y divide-border/50 rounded-lg border border-border/60 bg-background/20 text-sm">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Formation</dt>
                <dd className="font-medium text-right">
                  {initialProfile.formationStatus === "approved"
                    ? "Approved"
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
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">Public link</dt>
                <dd className="max-w-[55%] truncate text-right font-medium">
                  {initialProfile.publicSlug ? `/${initialProfile.publicSlug}` : "Not set"}
                </dd>
              </div>
            </dl>
            <div className="mt-auto grid gap-2 pt-1 sm:grid-cols-2">
              <Button asChild size="sm" className="h-9">
                <Link href="/my-organization?view=editor">Edit organization</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link href={nextFormationHref}>{continueInAcceleratorLabel}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          data-bento-card="activity"
          className={resolveMyOrganizationBentoCardClass("activity", { showLaunchRoadmapCard })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellIcon className="h-4 w-4" aria-hidden />
              Activity
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            </CardTitle>
            <CardDescription>Latest updates for your organization workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-background/20">
                {notifications.map((item) => {
                  const destinationHref =
                    item.href && item.href.trim().length > 0 && item.href.startsWith("/")
                      ? item.href
                      : "/my-organization"
                  const href = `/my-organization?readNotification=${encodeURIComponent(item.id)}&next=${encodeURIComponent(
                    destinationHref,
                  )}`
                  const badge = activityBadge(item)
                  return (
                    <li key={item.id}>
                      <Link href={href} className="group block px-3 py-3 transition hover:bg-muted/35">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</p>
                          <span className={`${badge.className} shrink-0 whitespace-nowrap px-2 py-0.5`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{item.description}</p>
                        <p className="text-muted-foreground mt-2 text-[11px]">{safeDateLabel(item.created_at, true)}</p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                No activity yet. Updates from roadmap, assignments, and team actions appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          data-bento-card="calendar"
          className={resolveMyOrganizationBentoCardClass("calendar", { showLaunchRoadmapCard })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheckIcon className="h-4 w-4" aria-hidden />
              Calendar
            </CardTitle>
            <CardDescription>Internal roadmap events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Next event</p>
              <p className="text-base font-semibold text-foreground">{nextCalendarEvent?.title ?? "No upcoming events"}</p>
              <p className="text-sm text-muted-foreground">
                {nextCalendarEvent
                  ? nextCalendarEvent.all_day
                    ? safeDateLabel(nextCalendarEvent.starts_at)
                    : safeDateLabel(nextCalendarEvent.starts_at, true)
                  : "Add your first internal milestone to populate this view."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                Google Meet
              </span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                {timezoneLabel}
              </span>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/20 p-3">
              <p className="text-lg font-semibold tracking-tight text-foreground">{calendarMonthLabel}</p>
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button asChild variant="outline" size="sm" className="h-9">
                <Link href="/roadmap/board-calendar">Open calendar</Link>
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link href="/roadmap/board-calendar">Add event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {showLaunchRoadmapCard ? (
          <Card
            data-bento-card="launch-roadmap"
            className={resolveMyOrganizationBentoCardClass("launchRoadmap", { showLaunchRoadmapCard })}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RocketIcon className="h-4 w-4" aria-hidden />
                Roadmap
              </CardTitle>
              <CardDescription>Core 501(c)(3) formation milestones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-background/20">
                {formationPreviewModules.map((module) => (
                  <li key={module.id}>
                    <Link href={module.href} className="block px-3 py-2.5 transition hover:bg-muted/35">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          {formationModuleStatusIcon(module.status)}
                          <p className="line-clamp-2 text-sm font-medium">{module.title}</p>
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium ${formationModuleStatusClass(module.status)}`}
                        >
                          {formationModuleStatusLabel(module.status)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">
                {formationCompletedCount}/{formationPreviewModules.length} complete
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <Link href="/accelerator">Open accelerator</Link>
                </Button>
                <Button asChild size="sm" className="h-9">
                  <Link href={nextFormationHref}>Continue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ProgramBuilderDashboardCard
          programs={programs ?? []}
          className={resolveMyOrganizationBentoCardClass("programBuilder", { showLaunchRoadmapCard })}
        />

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

        <Card
          data-bento-card="workspace-actions"
          className={resolveMyOrganizationBentoCardClass("workspaceActions", { showLaunchRoadmapCard })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RocketIcon className="h-4 w-4" aria-hidden />
              Actions
            </CardTitle>
            <CardDescription>Quick access for launch-critical workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="h-10 justify-between">
              <Link href="/roadmap">
                Strategic roadmap
                <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 justify-between">
              <Link href="/accelerator">
                Accelerator
                <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 justify-between">
              <Link href="/my-organization/documents">
                Board documents
                <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 justify-between">
              <Link href="/my-organization?view=editor&tab=programs">
                Programs tab
                <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <div aria-hidden className="h-5 shrink-0 md:h-6" />
    </div>
  )
}
