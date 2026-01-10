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
  governing_board: {
    label: "Governing Board",
    color: "var(--chart-4)",
  },
  advisory_board: {
    label: "Advisory Board",
    color: "var(--chart-5)",
  },
  volunteers: {
    label: "Volunteers",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function PeopleCompositionRadialCard({
  staff,
  governingBoard,
  advisoryBoard,
  volunteers,
  people,
}: {
  staff: number
  governingBoard: number
  advisoryBoard: number
  volunteers: number
  people?: OrgPerson[]
}) {
  const staffCount = Math.max(0, staff)
  const governingCount = Math.max(0, governingBoard)
  const advisoryCount = Math.max(0, advisoryBoard)
  const volunteersCount = Math.max(0, volunteers)
  const total = staffCount + governingCount + advisoryCount + volunteersCount
  const chartData = [
    {
      staff: staffCount,
      governing_board: governingCount,
      advisory_board: advisoryCount,
      volunteers: volunteersCount,
    },
  ]

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">People</CardTitle>
        <CardDescription>Staff, boards, and volunteers.</CardDescription>
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
              dataKey="governing_board"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-governing_board)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="advisory_board"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-advisory_board)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="volunteers"
              stackId="a"
              cornerRadius={8}
              fill="var(--color-volunteers)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Staff</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{staffCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Governing</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{governingCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Advisory</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{advisoryCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5">
            <span className="truncate">Volunteers</span>
            <span className="font-mono font-medium tabular-nums text-foreground">{volunteersCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
