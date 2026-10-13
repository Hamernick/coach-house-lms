"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { RoadmapAnalyticsSummary } from "@/lib/roadmap/analytics"

export function RoadmapAnalyticsSummaryCard({ summary }: { summary: RoadmapAnalyticsSummary | null }) {
  if (!summary) {
    return null
  }

  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle>Share performance (30 days)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric value={summary.totalViews} label="Page views" />
          <Metric value={summary.totalCtaClicks} label="CTA clicks" />
          <Metric value={`${summary.conversionRate}%`} label="Conversion rate" emphasize />
        </div>
        <Separator />
        <div className="grid gap-6 md:grid-cols-4">
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">Top sections</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.viewsBySection.length === 0 ? (
                <li className="text-muted-foreground">No published sections yet.</li>
              ) : (
                summary.viewsBySection.slice(0, 5).map((section) => (
                  <li key={section.sectionId ?? "all"} className="flex items-center justify-between">
                    <span>{section.sectionId ?? "Full page"}</span>
                    <span className="text-muted-foreground">{section.count} views</span>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">CTA activity</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.dailyCtaClicks.length === 0 ? (
                <li className="text-muted-foreground">No clicks yet.</li>
              ) : (
                summary.dailyCtaClicks.slice(-5).map((point) => (
                  <li key={point.date} className="flex items-center justify-between">
                    <span>{point.date}</span>
                    <span className="text-muted-foreground">{point.count}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">Top sources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.topSources.length === 0 ? (
                <li className="text-muted-foreground">No source data yet.</li>
              ) : (
                summary.topSources.map((source) => (
                  <li key={source.source ?? "direct"} className="flex items-center justify-between">
                    <span>{source.source ?? "Direct"}</span>
                    <span className="text-muted-foreground">{source.count}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">Time on page</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.timeBuckets.map((bucket) => (
                <li key={bucket.label} className="flex items-center justify-between">
                  <span>{bucket.label}</span>
                  <span className="text-muted-foreground">{bucket.count}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground">Weekly trend</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {summary.weeklyComparisons.map((week) => (
                <li key={week.label} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span>{week.label}</span>
                    <span className="text-muted-foreground text-xs">{week.views} views</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{week.clicks} clicks</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

type MetricProps = { value: number | string; label: string; emphasize?: boolean }

function Metric({ value, label, emphasize }: MetricProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 ${emphasize ? "text-3xl" : "text-2xl"} font-semibold text-foreground`}>{value}</p>
    </div>
  )
}
