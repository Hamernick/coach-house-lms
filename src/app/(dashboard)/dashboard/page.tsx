import type { SupabaseClient } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AlertTriangle, ArrowUpRight, BookOpen, Building2, Map, Sparkles, Users, type LucideIcon } from "lucide-react"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Badge } from "@/components/ui/badge"
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
import { getMapboxToken } from "@/lib/mapbox/token"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/dashboard")

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public, location_lat, location_lng")
    .eq("user_id", user.id)
    .maybeSingle<{
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
      location_lat: number | null
      location_lng: number | null
    }>()

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).map((section) =>
    publicSharingEnabled ? section : { ...section, isPublic: false },
  )
  const isOrgPublic = publicSharingEnabled ? Boolean(orgRow?.is_public) : false
  const meetingCount = typeof profile.meeting_requests === "number" ? profile.meeting_requests : 0

  const nextAction = await fetchNextAction(supabase, user.id)
  const publishedCount = sections.filter((s) => s.content.trim().length > 0 && s.isPublic).length
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

  const { count: programsCount } = await supabase
    .from("programs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null }>()
  const isFreeTier = isFreeTierSubscription(subscription ?? null)

  const acceleratorProgress = await fetchAcceleratorProgress(supabase, user.id)

  const reviseMeta = await fetchReviseMeta(supabase, user.id)

  const orgName = typeof profile.name === "string" && profile.name.trim().length > 0 ? profile.name.trim() : "Your organization"
  const orgTagline = typeof profile.tagline === "string" && profile.tagline.trim().length > 0 ? profile.tagline.trim() : null

  const hasAddressPin = orgRow?.location_lat != null && orgRow?.location_lng != null
  const mapToken = getMapboxToken()
  const mapEnabled = Boolean(mapToken)

  const mapCenter: [number, number] = hasAddressPin
    ? [orgRow?.location_lng ?? 0, orgRow?.location_lat ?? 20]
    : [0, 20]

  const lightMapUrl = mapEnabled
    ? buildMapboxStaticUrl({
        token: mapToken,
        styleId: "light-v11",
        center: mapCenter,
        zoom: hasAddressPin ? 10 : 1.2,
        width: 1280,
        height: 720,
      })
    : null
  const darkMapUrl = mapEnabled
    ? buildMapboxStaticUrl({
        token: mapToken,
        styleId: "dark-v11",
        center: mapCenter,
        zoom: hasAddressPin ? 10 : 1.2,
        width: 1280,
        height: 720,
      })
    : null

  const today = new Date()
  const calendarEvents = [
    firstEmpty
      ? {
          date: today.toISOString(),
          label: `Draft: ${firstEmpty.title}`,
          href: "/strategic-roadmap",
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Card className="relative overflow-hidden border-border/70 bg-card/70">
          <div className="pointer-events-none absolute inset-0">
            {mapEnabled ? (
              <>
                {lightMapUrl ? (
                  <Image
                    alt=""
                    src={lightMapUrl}
                    fill
                    priority={false}
                    className="object-cover opacity-40 dark:hidden"
                    sizes="(max-width: 1024px) 100vw, 1400px"
                  />
                ) : null}
                {darkMapUrl ? (
                  <Image
                    alt=""
                    src={darkMapUrl}
                    fill
                    priority={false}
                    className="hidden object-cover opacity-35 dark:block"
                    sizes="(max-width: 1024px) 100vw, 1400px"
                  />
                ) : null}
              </>
            ) : (
              <div className="absolute inset-0 bg-dot-grid opacity-40 dark:opacity-30" />
            )}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--background)/0.55),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/90 via-background/35 to-background/90" />
          </div>

          <CardHeader className="relative pb-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{orgName}</h1>
              {orgTagline ? <p className="text-sm text-muted-foreground">{orgTagline}</p> : null}
            </div>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Focus</p>
                {nextAction ? (
                  <>
                    <p className="truncate text-sm font-medium text-foreground">
                      {nextAction.classTitle} · Module {nextAction.moduleIdx}: {nextAction.moduleTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">Continue your accelerator path — the sidebar stays in sync.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">All caught up</p>
                    <p className="text-xs text-muted-foreground">Polish your roadmap or publish your profile to the map.</p>
                  </>
                )}
              </div>

              {nextAction ? (
                <Button asChild size="sm">
                  <Link prefetch href={`/class/${nextAction.classSlug}/module/${nextAction.moduleIdx}`}>
                    <Sparkles className="h-4 w-4" />
                    Resume
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link prefetch href="/strategic-roadmap">
                    <BookOpen className="h-4 w-4" />
                    Strategic roadmap
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <Metric
                label="Roadmap"
                value={`${publishedCount}/${sections.length}`}
                meta={publishedCount > 0 ? "Published sections" : "Publish your first section"}
              />
              <Metric
                label="Programs"
                value={String(programsCount ?? 0)}
                meta={(programsCount ?? 0) > 0 ? "Active catalog" : "Add your first program"}
              />
            </div>
          </CardContent>

          <CardFooter className="relative flex flex-wrap items-center justify-between gap-2 border-t border-border/60 !py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {reviseMeta.count > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-foreground">Review requested</span>
                  <span>{reviseMeta.count} submission{reviseMeta.count === 1 ? "" : "s"} need revision.</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">All clear.</span>
                  <span>Keep shipping — your roadmap becomes your story.</span>
                </>
              )}
            </div>

            <Button asChild size="sm" variant="ghost">
              <Link prefetch href="/strategic-roadmap">
                Roadmap
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="min-w-0 space-y-4 lg:justify-self-end lg:self-start">
          <DashboardCalendarCard events={calendarEvents} />
          <DashboardCheckInCard userId={user.id} meetingCount={meetingCount} isFreeTier={isFreeTier} />
          <DashboardNotificationsCard items={notifications} />
        </div>
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
      href: "/strategic-roadmap",
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

function Metric({
  label,
  value,
  meta,
  tone = "neutral",
}: {
  label: string
  value: string
  meta: string
  tone?: "neutral" | "ok" | "warn"
}) {
  const badgeVariant = tone === "ok" ? "secondary" : tone === "warn" ? "outline" : "outline"
  const badgeClassName = tone === "warn" ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : undefined

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Badge variant={badgeVariant} className={badgeClassName}>
          {value}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}

function buildMapboxStaticUrl(input: {
  token: string
  styleId: string
  center: [number, number]
  zoom: number
  width: number
  height: number
}) {
  const token = input.token.trim()
  if (!token) return null
  const [lng, lat] = input.center
  const zoom = Number.isFinite(input.zoom) ? input.zoom : 1
  const width = Math.max(1, Math.round(input.width))
  const height = Math.max(1, Math.round(input.height))
  const styleId = input.styleId.trim()

  return `https://api.mapbox.com/styles/v1/mapbox/${encodeURIComponent(styleId)}/static/${lng},${lat},${zoom}/${width}x${height}?access_token=${encodeURIComponent(token)}`
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
