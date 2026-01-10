import type { SupabaseClient } from "@supabase/supabase-js"
import type { CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Building2, Globe2, MapPin, Palette } from "lucide-react"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { normalizePersonCategory } from "@/lib/people/categories"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PeopleCompositionRadialCard } from "@/components/dashboard/people-composition-radial-card"
import { DashboardCalendarCard } from "@/components/dashboard/dashboard-calendar-card"
import { DashboardCheckInCard } from "@/components/dashboard/dashboard-checkin-card"
import { DashboardNotificationsCard, type DashboardNotificationItem } from "@/components/dashboard/dashboard-notifications-card"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { fetchRoadmapAnalyticsSummary } from "@/lib/roadmap/analytics"
import { stripHtml } from "@/lib/markdown/convert"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import type { Database } from "@/lib/supabase/types"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { isFreeTierSubscription } from "@/lib/meetings"
import { cn } from "@/lib/utils"

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
    reviseMeta,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("profile, public_slug, is_public, is_public_roadmap, location_lat, location_lng")
      .eq("user_id", user.id)
      .maybeSingle<{
        profile: Record<string, unknown> | null
        public_slug: string | null
        is_public: boolean | null
        is_public_roadmap: boolean | null
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
    fetchReviseMeta(supabase, user.id),
  ])

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).map((section) =>
    publicSharingEnabled ? section : { ...section, isPublic: false },
  )
  const isOrgPublic = publicSharingEnabled ? Boolean(orgRow?.is_public) : false
  const isRoadmapPublic = publicSharingEnabled ? Boolean(orgRow?.is_public_roadmap) : false
  const meetingCount = typeof profile.meeting_requests === "number" ? profile.meeting_requests : 0
  const isFreeTier = isFreeTierSubscription(subscription ?? null)

  const firstEmpty = sections.find((s) => !s.content.trim())

  const peopleRaw = Array.isArray(profile.org_people) ? profile.org_people : []
  const peopleNormalized = peopleRaw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      ...(item as Record<string, unknown>),
      category: normalizePersonCategory(typeof item.category === "string" ? item.category : ""),
    })) as OrgPerson[]
  const peopleCount = peopleNormalized.length
  const peopleCategoryCounts = peopleNormalized.reduce(
    (acc, item) => {
      if (item.category === "governing_board") acc.governingBoard += 1
      else if (item.category === "advisory_board") acc.advisoryBoard += 1
      else if (item.category === "volunteers") acc.volunteers += 1
      else acc.staff += 1
      return acc
    },
    { staff: 0, governingBoard: 0, advisoryBoard: 0, volunteers: 0 },
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

  const roadmapAnalytics = await fetchRoadmapAnalyticsSummary()
  const orgName = typeof profile.name === "string" && profile.name.trim().length > 0 ? profile.name.trim() : "Your organization"
  const publicSlug = orgRow?.public_slug ?? null
  const publicUrl = publicSlug ? `/${publicSlug}` : null
  const roadmapUrl = publicSlug ? `/${publicSlug}/roadmap` : null
  const roadmapCompleteCount = sections.filter((section) => section.content.trim().length > 0).length
  const boilerplatePreview =
    typeof profile.boilerplate === "string" ? stripHtml(profile.boilerplate).trim() : ""
  const brandLogo =
    typeof profile.logoUrl === "string" && profile.logoUrl.trim().length > 0 ? profile.logoUrl.trim() : ""
  const brandPrimary =
    typeof profile.brandPrimary === "string" && profile.brandPrimary.trim().length > 0 ? profile.brandPrimary.trim() : ""
  const brandColors = Array.isArray(profile.brandColors)
    ? profile.brandColors.map((color) => String(color)).filter((color) => color.trim().length > 0)
    : []
  const brandSwatches = Array.from(new Set([brandPrimary, ...brandColors])).filter(Boolean).slice(0, 5)
  const hasBrandKit = Boolean(brandLogo || brandSwatches.length > 0 || boilerplatePreview)

  const hasNotifications = notifications.length > 0

  return (
    <div className="w-full space-y-6 md:-m-2">
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/70 bg-card/70">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {orgName}
                </CardTitle>
                <CardDescription>
                  {isOrgPublic ? "Public profile live and shareable." : "Drafting your public profile and roadmap."}
                </CardDescription>
              </div>
              <Badge variant={isOrgPublic ? "secondary" : "outline"} className="rounded-full">
                {isOrgPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Programs" value={programsCount ?? 0} />
              <StatTile label="People" value={peopleCount} />
              <StatTile label="Roadmap drafted" value={`${roadmapCompleteCount}/${sections.length}`} />
            </div>
            {nextAction ? (
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-xs uppercase text-muted-foreground">Next module</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {nextAction.classTitle} · Module {nextAction.moduleIdx}
                </p>
                <p className="text-xs text-muted-foreground">{nextAction.moduleTitle}</p>
                <Button asChild size="sm" className="mt-3 w-fit">
                  <Link href={`/class/${nextAction.classSlug}/module/${nextAction.moduleIdx}`}>
                    Resume accelerator <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t border-border/60">
            <Button asChild size="sm">
              <Link href="/my-organization">Edit profile</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/accelerator/roadmap">Open roadmap</Link>
            </Button>
            {isOrgPublic && publicUrl ? (
              <Button asChild size="sm" variant="outline">
                <Link href={publicUrl}>View public page</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/my-organization?tab=company">Publish profile</Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        <PublicPresenceCard
          analytics={roadmapAnalytics}
          isOrgPublic={isOrgPublic}
          isRoadmapPublic={isRoadmapPublic}
          publicUrl={publicUrl}
          roadmapUrl={roadmapUrl}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PeopleCompositionRadialCard
          staff={peopleCategoryCounts.staff}
          governingBoard={peopleCategoryCounts.governingBoard}
          advisoryBoard={peopleCategoryCounts.advisoryBoard}
          volunteers={peopleCategoryCounts.volunteers}
          people={peopleNormalized}
        />
        <BrandKitCard
          logoUrl={brandLogo}
          swatches={brandSwatches}
          boilerplate={boilerplatePreview}
          hasBrandKit={hasBrandKit}
        />
        <MapPreviewCard hasAddressPin={hasAddressPin} />
      </section>

      <section className={cn("grid gap-4", hasNotifications ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {hasNotifications ? <DashboardNotificationsCard items={notifications} /> : null}
        <DashboardCheckInCard userId={user.id} meetingCount={meetingCount} isFreeTier={isFreeTier} />
        <DashboardCalendarCard events={calendarEvents} />
      </section>
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
      description: "Build your org chart for staff, boards, and volunteers.",
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

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function PublicPresenceCard({
  analytics,
  isOrgPublic,
  isRoadmapPublic,
  publicUrl,
  roadmapUrl,
}: {
  analytics: Awaited<ReturnType<typeof fetchRoadmapAnalyticsSummary>>
  isOrgPublic: boolean
  isRoadmapPublic: boolean
  publicUrl: string | null
  roadmapUrl: string | null
}) {
  const summary = analytics ?? {
    totalViews: 0,
    totalCtaClicks: 0,
    conversionRate: 0,
  }

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              Public reach
            </CardTitle>
            <CardDescription>Roadmap and profile engagement over the last 30 days.</CardDescription>
          </div>
          <Badge variant={isOrgPublic ? "secondary" : "outline"} className="rounded-full">
            {isOrgPublic ? "Live" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Roadmap views" value={formatCompactNumber(summary.totalViews)} />
          <StatTile label="CTA clicks" value={formatCompactNumber(summary.totalCtaClicks)} />
          <StatTile label="Conversion" value={`${summary.conversionRate}%`} />
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Public profile</span>
            <span className={isOrgPublic ? "text-emerald-600" : "text-muted-foreground"}>
              {isOrgPublic ? "Live" : "Private"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Roadmap</span>
            <span className={isRoadmapPublic ? "text-emerald-600" : "text-muted-foreground"}>
              {isRoadmapPublic ? "Live" : "Hidden"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border/60">
        {isOrgPublic && publicUrl ? (
          <Button asChild size="sm" variant="outline">
            <Link href={publicUrl}>View public page</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/my-organization?tab=company">Publish profile</Link>
          </Button>
        )}
        {isRoadmapPublic && roadmapUrl ? (
          <Button asChild size="sm" variant="outline">
            <Link href={roadmapUrl}>View roadmap</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/accelerator/roadmap">Edit roadmap</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function BrandKitCard({
  logoUrl,
  swatches,
  boilerplate,
  hasBrandKit,
}: {
  logoUrl: string
  swatches: string[]
  boilerplate: string
  hasBrandKit: boolean
}) {
  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-4 w-4 text-muted-foreground" aria-hidden />
          Brand kit
        </CardTitle>
        <CardDescription>Logo, colors, and boilerplate at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasBrandKit ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                {logoUrl ? (
                  <Image src={logoUrl} alt="" fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Palette className="h-4 w-4" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {swatches.length > 0 ? (
                  swatches.map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="h-7 w-7 rounded-lg border border-border/60"
                      style={{ backgroundColor: color }}
                      aria-label={`Brand color ${color}`}
                    />
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Add brand colors</span>
                )}
              </div>
            </div>
            {boilerplate ? (
              <p className="text-xs text-muted-foreground line-clamp-3">{boilerplate}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Add a boilerplate summary for quick sharing.</p>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/50 px-4 py-6 text-center text-xs text-muted-foreground">
            Add your logo, colors, and boilerplate to build a quick-share brand kit.
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border/60">
        <Button asChild size="sm" variant="outline">
          <Link href="/my-organization?tab=company">Open brand kit</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function MapPreviewCard({ hasAddressPin }: { hasAddressPin: boolean }) {
  const mapStyle: CSSProperties = {
    backgroundImage: [
      "radial-gradient(circle at 18% 20%, hsl(var(--chart-2) / 0.25), transparent 55%)",
      "radial-gradient(circle at 78% 30%, hsl(var(--primary) / 0.2), transparent 50%)",
      "repeating-linear-gradient(0deg, hsl(var(--border) / 0.35) 0 1px, transparent 1px 64px)",
      "repeating-linear-gradient(90deg, hsl(var(--border) / 0.35) 0 1px, transparent 1px 64px)",
    ].join(","),
  } as React.CSSProperties

  return (
    <Card className="relative aspect-square overflow-hidden rounded-3xl border-border/70 bg-card/70 p-0">
      <div className="absolute inset-0" style={mapStyle} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/30 to-background/90" />
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden />
          Resource map
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Map presence</p>
          <p className="text-sm text-muted-foreground">
            {hasAddressPin
              ? "Your organization is pinned on the community map."
              : "Add your address to appear on the community map."}
          </p>
          <Button asChild size="sm" variant="outline" className="w-fit">
            <Link href={hasAddressPin ? "/community" : "/my-organization?tab=company"}>
              {hasAddressPin ? "View map" : "Add address"}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}
