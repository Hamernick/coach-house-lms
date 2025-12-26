"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { CreatePersonDialog } from "@/components/people/create-person-dialog"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  staff: {
    label: "Staff",
    color: "var(--chart-1)",
  },
  board: {
    label: "Board",
    color: "var(--chart-4)",
  },
  supporters: {
    label: "Supporters",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function PeopleCompositionRadialCard({
  staff,
  board,
  supporters,
  people,
}: {
  staff: number
  board: number
  supporters: number
  people?: OrgPerson[]
}) {
  const staffCount = Math.max(0, staff)
  const boardCount = Math.max(0, board)
  const supportersCount = Math.max(0, supporters)
  const total = staffCount + boardCount + supportersCount
  const chartData = [{ staff: staffCount, board: boardCount, supporters: supportersCount }]

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">People</CardTitle>
        <CardDescription>Staff, board, supporters.</CardDescription>
        <CardAction>
          <CreatePersonDialog triggerClassName="h-8" people={people ?? []} />
        </CardAction>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[210px]">
          <RadialBarChart data={chartData} startAngle={90} endAngle={-270} innerRadius={78} outerRadius={118}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        {total.toLocaleString()}
                      </tspan>
                      <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-xs font-medium">
                        People
                      </tspan>
                    </text>
                  )
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="staff"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-staff)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="board"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-board)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="supporters"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-supporters)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Staff</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{staffCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Board</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{boardCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Supporters</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{supportersCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
