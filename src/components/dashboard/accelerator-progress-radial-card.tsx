"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Label, PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function AcceleratorProgressRadialCard({
  completed,
  total,
  nextLabel,
  cta,
}: {
  completed: number
  total: number
  nextLabel?: string | null
  cta: { href: string; label: string }
}) {
  const safeTotal = Math.max(0, total)
  const completedCount = Math.min(Math.max(0, completed), safeTotal)
  const domainMax = Math.max(1, safeTotal)
  const pct = safeTotal > 0 ? Math.round((completedCount / safeTotal) * 100) : 0
  const chartData = [{ completed: completedCount }]

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Accelerator</CardTitle>
        <CardDescription>
          {safeTotal === 0 ? "Total: 0 modules" : `${completedCount}/${safeTotal} modules · ${pct}% complete`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[210px]">
          <RadialBarChart data={chartData} startAngle={90} endAngle={-270} innerRadius={78} outerRadius={108}>
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted/50 last:fill-background"
              polarRadius={[86, 74]}
            />
            <PolarAngleAxis type="number" domain={[0, domainMax]} tick={false} axisLine={false} />
            <RadialBar dataKey="completed" fill="var(--color-completed)" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
                  const cx = Number(viewBox.cx)
                  const cy = Number(viewBox.cy)
                  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={cx} y={cy} className="fill-foreground text-3xl font-semibold tabular-nums">
                        {completedCount}/{safeTotal}
                      </tspan>
                      <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-xs font-medium">
                        Modules
                      </tspan>
                    </text>
                  )
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next up</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {nextLabel || (safeTotal === 0 ? "Start your first module." : "You’re caught up.")}
            </p>
          </div>

          <Button asChild size="sm" className="h-8 shrink-0 self-start sm:self-auto">
            <Link prefetch href={cta.href} className="gap-2">
              {cta.label}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
