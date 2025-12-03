import { subDays } from "date-fns"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export type RoadmapAnalyticsSummary = {
  totalViews: number
  totalCtaClicks: number
  conversionRate: number
  viewsBySection: Array<{ sectionId: string | null; count: number }>
  dailyViews: Array<{ date: string; count: number }>
  dailyCtaClicks: Array<{ date: string; count: number }>
  topSources: Array<{ source: string | null; count: number }>
  timeBuckets: Array<{ label: string; count: number }>
  weeklyComparisons: Array<{ label: string; views: number; clicks: number }>
}

export async function fetchRoadmapAnalyticsSummary(): Promise<RoadmapAnalyticsSummary | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }

  const start = subDays(new Date(), 30).toISOString()
  const { data: events } = await supabase
    .from("roadmap_events")
    .select("event_type, section_id, created_at")
    .eq("org_id", user.id)
    .gte("created_at", start)
    .order("created_at", { ascending: false })

  if (!events || events.length === 0) {
    return {
      totalViews: 0,
      totalCtaClicks: 0,
      conversionRate: 0,
      viewsBySection: [],
      dailyViews: [],
      dailyCtaClicks: [],
      topSources: [],
      timeBuckets: [
        { label: "<30s", count: 0 },
        { label: "30-60s", count: 0 },
        { label: "1-3m", count: 0 },
        { label: ">3m", count: 0 },
      ],
      weeklyComparisons: buildWeeklyComparison([], []),
    }
  }

  const totalViews = events.filter((event) => event.event_type === "view").length
  const totalCtaClicks = events.filter((event) => event.event_type === "cta_click").length
  const conversionRate = totalViews > 0 ? Number(((totalCtaClicks / totalViews) * 100).toFixed(1)) : 0

  const viewsBySectionMap = new Map<string | null, number>()
  const dailyViewsMap = new Map<string, number>()
  const dailyCtaMap = new Map<string, number>()
  const sourceMap = new Map<string | null, number>()

  const timeBucketsMap = new Map<string, number>()
  const bucketLabels: Array<{ label: string; predicate: (duration: number) => boolean }> = [
    { label: "<30s", predicate: (duration) => duration < 30_000 },
    { label: "30-60s", predicate: (duration) => duration >= 30_000 && duration < 60_000 },
    { label: "1-3m", predicate: (duration) => duration >= 60_000 && duration < 180_000 },
    { label: ">3m", predicate: (duration) => duration >= 180_000 },
  ]

  events.forEach((event) => {
    const dateKey = event.created_at?.slice(0, 10) ?? ""
    if (event.event_type === "view") {
      const current = viewsBySectionMap.get(event.section_id ?? null) ?? 0
      viewsBySectionMap.set(event.section_id ?? null, current + 1)
      dailyViewsMap.set(dateKey, (dailyViewsMap.get(dateKey) ?? 0) + 1)
      const normalizedSource = event.source?.trim().toLowerCase() ?? "direct"
      sourceMap.set(normalizedSource, (sourceMap.get(normalizedSource) ?? 0) + 1)
      const duration = typeof event.duration_ms === "number" ? event.duration_ms : null
      if (duration !== null) {
        const bucket = bucketLabels.find((item) => item.predicate(duration))
        if (bucket) {
          timeBucketsMap.set(bucket.label, (timeBucketsMap.get(bucket.label) ?? 0) + 1)
        }
      }
    }
    if (event.event_type === "cta_click") {
      dailyCtaMap.set(dateKey, (dailyCtaMap.get(dateKey) ?? 0) + 1)
    }
  })

  const viewsBySection = Array.from(viewsBySectionMap.entries())
    .map(([sectionId, count]) => ({ sectionId, count }))
    .sort((a, b) => b.count - a.count)

  const dailyViews = Array.from(dailyViewsMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const dailyCtaClicks = Array.from(dailyCtaMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalViews,
    totalCtaClicks,
    conversionRate,
    viewsBySection,
    dailyViews,
    dailyCtaClicks,
    topSources: Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    timeBuckets: bucketLabels.map((bucket) => ({
      label: bucket.label,
      count: timeBucketsMap.get(bucket.label) ?? 0,
    })),
    weeklyComparisons: buildWeeklyComparison(dailyViews, dailyCtaClicks),
  }
}

function buildWeeklyComparison(
  dailyViews: Array<{ date: string; count: number }>,
  dailyCta: Array<{ date: string; count: number }>,
): Array<{ label: string; views: number; clicks: number }> {
  const weeks: Array<{ label: string; range: [Date, Date] }> = []
  const today = new Date()
  for (let i = 0; i < 4; i += 1) {
    const end = new Date(today)
    end.setDate(end.getDate() - i * 7)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const label = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    )}`
    weeks.push({ label, range: [start, end] })
  }

  return weeks.map((week) => {
    const views = dailyViews
      .filter((point) => dateInRange(point.date, week.range))
      .reduce((acc, curr) => acc + curr.count, 0)
    const clicks = dailyCta.filter((point) => dateInRange(point.date, week.range)).reduce((acc, curr) => acc + curr.count, 0)
    return { label: week.label, views, clicks }
  })
}

function dateInRange(dateStr: string, [start, end]: [Date, Date]) {
  const date = new Date(dateStr)
  return date >= start && date <= end
}
