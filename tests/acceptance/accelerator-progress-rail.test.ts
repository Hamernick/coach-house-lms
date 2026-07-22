import { readFileSync } from "node:fs"
import { join } from "node:path"

import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  AcceleratorProgressRail,
  resolveAcceleratorProgressRailState,
} from "@/components/accelerator/accelerator-progress-rail"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("accelerator progress rail", () => {
  it("resolves usage-bar segments before the fundable checkpoint", () => {
    const state = resolveAcceleratorProgressRailState({
      progressPercent: 42,
      fundableCheckpoint: ACCELERATOR_FUNDABLE_THRESHOLD,
      verifiedCheckpoint: ACCELERATOR_VERIFIED_THRESHOLD,
    })

    expect(state.firstSegmentFill).toBe(42)
    expect(state.secondSegmentWidth).toBe(0)
    expect(state.fundableReached).toBe(false)
    expect(state.verifiedReached).toBe(false)
    expect(state.firstSegmentClass).toBe("bg-amber-500")
    expect(state.segments).toMatchObject([
      {
        id: "build",
        label: "Build",
        rangeLabel: "0-70%",
        width: 70,
        fillPercent: 60,
        active: true,
        trackClassName: "bg-amber-500/20 dark:bg-amber-400/18",
        fillClassName: "bg-amber-500",
      },
      {
        id: "fundable",
        label: "Fundable",
        rangeLabel: "70-90%",
        width: 20,
        fillPercent: 0,
        active: false,
        trackClassName: "bg-emerald-500/25 dark:bg-emerald-400/25",
        fillClassName: "bg-emerald-500",
      },
      {
        id: "verified",
        label: "Verified",
        rangeLabel: "90-100%",
        width: 10,
        fillPercent: 0,
        active: false,
        trackClassName: "bg-sky-500/25 dark:bg-sky-400/25",
        fillClassName: "bg-sky-500",
      },
    ])
  })

  it("fills through every usage-bar segment after verification is reached", () => {
    const state = resolveAcceleratorProgressRailState({
      progressPercent: 100,
      fundableCheckpoint: ACCELERATOR_FUNDABLE_THRESHOLD,
      verifiedCheckpoint: ACCELERATOR_VERIFIED_THRESHOLD,
    })

    expect(state.firstSegmentFill).toBe(ACCELERATOR_FUNDABLE_THRESHOLD)
    expect(state.secondSegmentWidth).toBe(100 - ACCELERATOR_FUNDABLE_THRESHOLD)
    expect(state.fundableReached).toBe(true)
    expect(state.verifiedReached).toBe(true)
    expect(state.firstSegmentClass).toBe("bg-amber-500")
    expect(state.secondSegmentClass).toBe("bg-emerald-500")
    expect(state.segments.map((segment) => segment.fillPercent)).toEqual([
      100, 100, 100,
    ])
  })

  it("keeps the colored rail segments free of embedded icons", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AcceleratorProgressRail, {
        progressPercent: 80,
      })
    )

    expect(markup).not.toContain('data-slot="accelerator-progress-milestone"')
    expect(markup).toContain("bg-emerald-500")
    expect(markup).toContain("bg-sky-500")
    expect(markup).toContain("Fundable segment, 70-90%")
    expect(markup).toContain("Verified segment, 90-100%")
  })

  it("uses concise shadcn tooltips instead of separate milestone trigger buttons", () => {
    const source = readSource(
      "src/components/accelerator/accelerator-progress-rail.tsx"
    )

    expect(source).toContain('data-slot="accelerator-segmented-progress"')
    expect(source).toContain('data-slot="accelerator-progress-segment"')
    expect(source).toContain(
      'data-slot="accelerator-progress-segment-indicator"'
    )
    expect(source).toContain('from "@/components/ui/tooltip"')
    expect(source).toContain("<Tooltip")
    expect(source).toContain("delayDuration={140}")
    expect(source).toContain("disableHoverableContent")
    expect(source).toContain("<TooltipTrigger asChild>")
    expect(source).toContain("<TooltipContent")
    expect(source).toContain("${segment.label} segment, ${segment.rangeLabel}")
    expect(source).toContain("formatSegmentStatusLabel")
    expect(source).toContain("segmentStatusLabels")
    expect(source).toContain('className="px-2.5 py-1.5"')
    expect(source).not.toContain('data-slot="accelerator-progress-milestone"')
    expect(source).toContain('className="bg-border/40 flex h-3')
    expect(source).toContain('from "lucide-react/dist/esm/icons/dollar-sign"')
    expect(source).toContain('from "lucide-react/dist/esm/icons/badge-check"')
    expect(source).toContain("MILESTONE_VISUALS")
    expect(source).toContain("`${completeCount}/${items.length} ready`")
    expect(source).toContain('from "@/components/ui/button"')
    expect(source).toContain('variant="ghost"')
    expect(source).toContain('size="sm"')
    expect(source).toContain("hover:bg-transparent")
    expect(source).not.toContain('from "@/components/ui/hover-card"')
    expect(source).not.toContain("<HoverCard")
    expect(source).not.toContain("formatSegmentChecklistSummary")
    expect(source).not.toContain("segment.description")
    expect(source).not.toContain("requirements complete")
    expect(source).not.toContain('size="icon"')
    expect(source).not.toContain('aria-label="Fundable checkpoint"')
    expect(source).not.toContain('aria-label="Verified checkpoint"')
    expect(source).toContain("DollarSignIcon")
    expect(source).toContain("BadgeCheckIcon")
  })

  it("uses distinct segment colors instead of a monochrome usage bar", () => {
    const source = readSource(
      "src/components/accelerator/accelerator-progress-rail.tsx"
    )

    expect(source).toContain("bg-border/40")
    expect(source).toContain("bg-amber-500/20 dark:bg-amber-400/18")
    expect(source).toContain("bg-emerald-500/25 dark:bg-emerald-400/25")
    expect(source).toContain("bg-sky-500/25 dark:bg-sky-400/25")
    expect(source).toContain('fillClassName: "bg-amber-500"')
    expect(source).toContain('fillClassName: "bg-emerald-500"')
    expect(source).toContain('fillClassName: "bg-sky-500"')

    expect(source).not.toContain('segment.reached ? "bg-primary"')
    expect(source).not.toContain(
      'segment.reached ? "bg-primary" : "bg-primary/70"'
    )
    expect(source).not.toContain("border-zinc-300")
    expect(source).not.toContain("dark:border-zinc-600")
    expect(source).toContain("text-emerald-700 dark:text-emerald-300")
    expect(source).toContain("text-sky-700 dark:text-sky-300")
  })
})
