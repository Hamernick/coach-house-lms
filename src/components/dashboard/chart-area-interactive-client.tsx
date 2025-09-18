"use client"

import dynamic from "next/dynamic"

import { ChartSkeleton } from "@/components/dashboard/skeletons"

const ChartAreaInteractive = dynamic(
  () => import("@/components/chart-area-interactive").then((mod) => ({ default: mod.ChartAreaInteractive })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export function DynamicChartAreaInteractive() {
  return <ChartAreaInteractive />
}
