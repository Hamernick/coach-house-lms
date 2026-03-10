import { describe, expect, it } from "vitest"

import { applyFormationStatusAcceleratorProgressOverrides } from "@/app/(dashboard)/my-organization/_lib/my-organization-accelerator-progress"
import type { AcceleratorProgressSummary } from "@/lib/accelerator/progress"

describe("my organization accelerator progress", () => {
  it("marks core formation modules complete when the org is already approved", () => {
    const summary: AcceleratorProgressSummary = {
      groups: [
        {
          id: "group-1",
          title: "Formation",
          description: null,
          slug: "formation",
          modules: [
            {
              id: "module-1",
              slug: "naming-your-nfp",
              title: "Naming your NFP",
              description: null,
              href: "/accelerator/class/formation/module/1",
              status: "not_started",
              index: 1,
              hasNotes: false,
            },
            {
              id: "module-2",
              slug: "plain-module",
              title: "NFP Registration",
              description: null,
              href: "/accelerator/class/formation/module/2",
              status: "in_progress",
              index: 2,
              hasNotes: false,
            },
            {
              id: "module-3",
              slug: "budgeting-for-a-program",
              title: "Budgeting for a Program",
              description: null,
              href: "/accelerator/class/formation/module/7",
              status: "in_progress",
              index: 7,
              hasNotes: false,
            },
          ],
        },
      ],
      totalModules: 3,
      completedModules: 0,
      inProgressModules: 2,
      percent: 0,
    }

    const next = applyFormationStatusAcceleratorProgressOverrides(
      summary,
      "approved",
    )

    expect(next.groups[0]?.modules.map((module) => module.status)).toEqual([
      "completed",
      "completed",
      "in_progress",
    ])
    expect(next.completedModules).toBe(2)
    expect(next.inProgressModules).toBe(1)
    expect(next.percent).toBe(67)
  })

  it("leaves accelerator progress unchanged for pre-501(c)(3) and in-progress orgs", () => {
    const summary: AcceleratorProgressSummary = {
      groups: [
        {
          id: "group-1",
          title: "Formation",
          description: null,
          slug: "formation",
          modules: [
            {
              id: "module-1",
              slug: "naming-your-nfp",
              title: "Naming your NFP",
              description: null,
              href: "/accelerator/class/formation/module/1",
              status: "not_started",
              index: 1,
              hasNotes: false,
            },
          ],
        },
      ],
      totalModules: 1,
      completedModules: 0,
      inProgressModules: 0,
      percent: 0,
    }

    expect(
      applyFormationStatusAcceleratorProgressOverrides(summary, "pre_501c3"),
    ).toBe(summary)
    expect(
      applyFormationStatusAcceleratorProgressOverrides(summary, "in_progress"),
    ).toBe(summary)
  })
})
