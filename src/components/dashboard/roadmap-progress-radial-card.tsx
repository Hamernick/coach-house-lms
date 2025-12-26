"use client"

import { Label, PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  published: {
    label: "Published",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function RoadmapProgressRadialCard({
  published,
  total,
  label = "Roadmap",
}: {
  published: number
  total: number
  label?: string
}) {
  const safeTotal = Math.max(0, total)
  const publishedCount = Math.min(Math.max(0, published), safeTotal)
  const chartData = [{ published: publishedCount }]
  const domainMax = Math.max(1, safeTotal)

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{label}</CardTitle>
        <CardDescription>{safeTotal === 0 ? "No sections yet." : "Published sections."}</CardDescription>
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
            <RadialBar dataKey="published" fill="var(--color-published)" background cornerRadius={10} />
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
                        {publishedCount}/{safeTotal}
                      </tspan>
                      <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-xs font-medium">
                        Published
                      </tspan>
                    </text>
                  )
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

