import type { SupabaseClient } from "@supabase/supabase-js"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Building2, Map, Sparkles, Users, type LucideIcon } from "lucide-react"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AcceleratorProgressRadialCard } from "@/components/dashboard/accelerator-progress-radial-card"
import { PeopleCompositionRadialCard } from "@/components/dashboard/people-composition-radial-card"
import { DashboardCalendarCard } from "@/components/dashboard/dashboard-calendar-card"
import { DashboardCheckInCard } from "@/components/dashboard/dashboard-checkin-card"
import { DashboardNotificationsCard, type DashboardNotificationItem } from "@/components/dashboard/dashboard-notifications-card"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import type { Database } from "@/lib/supabase/types"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { isFreeTierSubscription } from "@/lib/meetings"

export const dynamic = "force-dynamic"
const ROADMAP_TAB_HREF = "/my-organization?tab=roadmap"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/dashboard")

  const [
    { data: orgRow },
    { count: programsCount },
    { data: subscription },
    nextAction,
    acceleratorProgress,
    reviseMeta,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("profile, public_slug, is_public, location_lat, location_lng")
      .eq("user_id", user.id)
      .maybeSingle<{
        profile: Record<string, unknown> | null
        public_slug: string | null
        is_public: boolean | null
        location_lat: number | null
        location_lng: number | null
      }>(),
    supabase
      .from("programs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("subscriptions")
      .select("status, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string | null; metadata: Json | null }>(),
    fetchNextAction(supabase, user.id),
    fetchAcceleratorProgress(supabase, user.id),
    fetchReviseMeta(supabase, user.id),
  ])

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).map((section) =>
    publicSharingEnabled ? section : { ...section, isPublic: false },
  )
  const isOrgPublic = publicSharingEnabled ? Boolean(orgRow?.is_public) : false
  const meetingCount = typeof profile.meeting_requests === "number" ? profile.meeting_requests : 0
  const isFreeTier = isFreeTierSubscription(subscription ?? null)

  const firstEmpty = sections.find((s) => !s.content.trim())

  const peopleRaw = Array.isArray(profile.org_people) ? profile.org_people : []
  const peopleCount = peopleRaw.length
  const peopleCategoryCounts = peopleRaw.reduce(
    (acc, item) => {
      if (!item || typeof item !== "object") return acc
      const categoryRaw = "category" in item ? (item.category as unknown) : null
      const categoryValue = typeof categoryRaw === "string" ? categoryRaw.toLowerCase() : ""
      if (categoryValue.startsWith("board")) acc.board += 1
      else if (categoryValue.startsWith("support")) acc.supporters += 1
      else acc.staff += 1
      return acc
    },
    { staff: 0, board: 0, supporters: 0 },
  )

  const hasAddressPin = orgRow?.location_lat != null && orgRow?.location_lng != null

  const today = new Date()
  const calendarEvents = [
    firstEmpty
      ? {
          date: today.toISOString(),
          label: `Draft: ${firstEmpty.title}`,
          href: ROADMAP_TAB_HREF,
          type: "roadmap" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    date: string
    label: string
    href?: string
    type?: "roadmap" | "org" | "people" | "marketplace" | "note"
  }>

  const notifications = buildDashboardNotifications({
    firstEmptyRoadmapTitle: firstEmpty?.title ?? null,
    reviseCount: reviseMeta.count,
    reviseHref: reviseMeta.href,
    isPublic: isOrgPublic,
    peopleCount,
    programsCount: programsCount ?? 0,
    hasAddressPin,
  })

  return (
    <div className="w-full space-y-4 md:-m-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/my-organization"
          icon={Building2}
          title="My organization"
          description={isOrgPublic ? "Public profile" : "Profile settings + publishing"}
        />
        <QuickActionCard
          href="/people"
          icon={Users}
          title="People"
          description={peopleCount > 0 ? `${peopleCount} on your org chart` : "Build your org chart"}
        />
        <QuickActionCard href="/marketplace" icon={Sparkles} title="Marketplace" description="Bookmark tools + services" />
        <QuickActionCard
          href="/community"
          icon={Map}
          title="Resource map"
          description={hasAddressPin ? "Pinned location" : "Add an address to pin"}
        />
      </div>

      <div className="min-w-0 space-y-4">
        <DashboardCalendarCard events={calendarEvents} />
        <DashboardCheckInCard userId={user.id} meetingCount={meetingCount} isFreeTier={isFreeTier} />
        <DashboardNotificationsCard items={notifications} />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <AcceleratorProgressRadialCard
          completed={acceleratorProgress.completed}
          total={acceleratorProgress.total}
          nextLabel={
            nextAction
              ? `${nextAction.classTitle} · Module ${nextAction.moduleIdx}: ${nextAction.moduleTitle}`
              : null
          }
          cta={{
            href: nextAction ? `/class/${nextAction.classSlug}/module/${nextAction.moduleIdx}` : "/classes",
            label: nextAction ? "Resume" : "View classes",
          }}
        />
        <PeopleCompositionRadialCard
          staff={peopleCategoryCounts.staff}
          board={peopleCategoryCounts.board}
          supporters={peopleCategoryCounts.supporters}
          people={peopleRaw as OrgPerson[]}
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Marketplace</CardTitle>
            <CardDescription>Tools and services worth bookmarking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              {getMarketplacePicks().map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="border-t border-border/60">
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
              <Link prefetch href="/marketplace">
                Browse marketplace
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Insights</CardTitle>
            <CardDescription>Placeholder.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-border/60 bg-background/50 px-4 py-6">
              <p className="text-sm font-medium text-foreground">Coming soon</p>
              <p className="mt-1 text-xs text-muted-foreground">KPIs, tasks, and a weekly digest will live here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildDashboardNotifications(input: {
  firstEmptyRoadmapTitle: string | null
  reviseCount: number
  reviseHref: string | null
  isPublic: boolean
  peopleCount: number
  programsCount: number
  hasAddressPin: boolean
}): DashboardNotificationItem[] {
  const items: DashboardNotificationItem[] = []

  if (input.reviseCount > 0) {
    items.push({
      id: "revise",
      title: input.reviseCount === 1 ? "Revision requested" : "Revisions requested",
      description: input.reviseHref
        ? "Update the latest flagged submission to keep progression unblocked."
        : "Update flagged submissions to keep progression unblocked.",
      href: input.reviseHref ?? "/classes",
      badge: String(input.reviseCount),
    })
  }

  if (input.firstEmptyRoadmapTitle) {
    items.push({
      id: "roadmap",
      title: `Draft roadmap: ${input.firstEmptyRoadmapTitle}`,
      description: "Turn your work into a narrative stakeholders can scan in minutes.",
      href: ROADMAP_TAB_HREF,
    })
  }

  if (!input.isPublic) {
    items.push({
      id: "publish",
      title: "Publish your profile",
      description: input.hasAddressPin
        ? "Make your org visible on the Resource Map and community pages."
        : "Add your address to pin your org, then publish to the Resource Map.",
      href: "/my-organization",
    })
  }

  if (input.peopleCount === 0) {
    items.push({
      id: "people",
      title: "Add your team",
      description: "Build your org chart for staff, board, and supporters.",
      href: "/people",
    })
  }

  if (input.programsCount === 0) {
    items.push({
      id: "programs",
      title: "Add your first program",
      description: "Track pilots, goals, funding, and the link you want supporters to click.",
      href: "/my-organization",
    })
  }

  return items
}

async function fetchNextAction(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
): Promise<{ classSlug: string; classTitle: string; moduleIdx: number; moduleTitle: string } | null> {
  const { data: nextModuleId } = await supabase.rpc("next_unlocked_module", { p_user_id: userId })
  if (!nextModuleId) return null

  const { data: mod } = await supabase
    .from("modules")
    .select("id, idx, title, class_id")
    .eq("id", nextModuleId as string)
    .maybeSingle<{ id: string; idx: number; title: string | null; class_id: string }>()
  if (!mod) return null

  const { data: klass } = await supabase
    .from("classes")
    .select("id, slug, title")
    .eq("id", mod.class_id)
    .maybeSingle<{ id: string; slug: string | null; title: string | null }>()
  if (!klass || !klass.slug) return null

  return {
    classSlug: klass.slug,
    classTitle: klass.title ?? "Class",
    moduleIdx: mod.idx,
    moduleTitle: mod.title ?? "Module",
  }
}

async function fetchAcceleratorProgress(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
): Promise<{ total: number; completed: number }> {
  // RLS already enforces visibility: published modules in published classes OR enrolled classes OR admin.
  const { data: modules } = await supabase.from("modules").select("id").returns<Array<{ id: string }>>()

  const moduleIds = (modules ?? []).map((row) => row.id)
  const total = moduleIds.length
  if (total === 0) return { total, completed: 0 }

  const { count: completedCount } = await supabase
    .from("module_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("module_id", moduleIds)
    .eq("status", "completed")

  return { total, completed: completedCount ?? 0 }
}

async function fetchReviseMeta(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
): Promise<{ count: number; href: string | null }> {
  const { data, count } = await supabase
    .from("assignment_submissions")
    .select("module_id, modules ( idx, class_id, classes ( slug ) )", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "revise")
    .order("updated_at", { ascending: false })
    .limit(1)
    .returns<
      Array<{
        module_id: string
        modules: { idx: number | null; class_id: string | null; classes: { slug: string | null } | null } | null
      }>
    >()

  const first = data?.[0]
  const slug = first?.modules?.classes?.slug ?? null
  const idx = typeof first?.modules?.idx === "number" ? first.modules.idx : null

  return {
    count: count ?? 0,
    href: slug && idx ? `/class/${slug}/module/${idx}` : null,
  }
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      prefetch
      href={href}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 transition-colors hover:bg-accent/35"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
    </Link>
  )
}

function getMarketplacePicks(): Array<{ id: string; name: string; description: string; url: string }> {
  // Avoid importing marketplace client code; keep this list tiny and dashboard-friendly.
  return [
    {
      id: "harbor-compliance",
      name: "Harbor Compliance",
      description: "Nonprofit formation and fundraising registration across states.",
      url: "https://www.harborcompliance.com/",
    },
    {
      id: "catchafire",
      name: "Catchafire",
      description: "Volunteer professional services marketplace for nonprofits.",
      url: "https://www.catchafire.org/",
    },
    {
      id: "fluxx",
      name: "Fluxx",
      description: "Grants management software used by foundations and nonprofits.",
      url: "https://www.fluxx.io/",
    },
  ]
}
