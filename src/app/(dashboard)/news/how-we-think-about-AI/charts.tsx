"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

const usageData = [
  { label: "2017", requests: 0.1 },
  { label: "2019", requests: 1 },
  { label: "2021", requests: 12 },
  { label: "2023", requests: 120 },
  { label: "2025", requests: 1200 },
]

const accuracyData = [
  { label: "Rule-based", score: 40 },
  { label: "Classical ML", score: 65 },
  { label: "Large models", score: 82 },
]

const chartConfig = {
  requests: {
    label: "Requests per month (×10³)",
    color: "hsl(var(--primary))",
  },
  score: {
    label: "Task quality (%)",
    color: "hsl(var(--chart-3))",
  },
} as const

export function AIUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Requests over time (illustrative)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer id="ai-usage" config={chartConfig} className="aspect-[16/9]">
          <BarChart data={usageData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="requests" radius={4} fill="var(--color-requests)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function AIQualityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Task quality across approaches</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer id="ai-quality" config={chartConfig} className="aspect-[16/9]">
          <BarChart data={accuracyData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" radius={4} fill="var(--color-score)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
