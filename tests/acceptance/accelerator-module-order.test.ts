import { describe, expect, it } from "vitest"

import { sortAcceleratorModules } from "@/lib/accelerator/module-order"

type TestModule = {
  slug: string
  title: string
  index: number
  sequence?: number
  href?: string
}

describe("sortAcceleratorModules", () => {
  it("keeps core Formation modules ahead of non-core modules", () => {
    const modules: TestModule[] = [
      {
        slug: "start-with-your-why",
        title: "Start with your why",
        index: 2,
        sequence: 0,
        href: "/accelerator/class/strategic-foundations/module/2",
      },
      {
        slug: "nfp-registration",
        title: "NFP Registration",
        index: 5,
        sequence: 1005,
        href: "/accelerator/class/electives/module/5",
      },
      {
        slug: "naming-your-nfp",
        title: "Naming your NFP",
        index: 4,
        sequence: 1004,
        href: "/accelerator/class/electives/module/4",
      },
      {
        slug: "filing-1023",
        title: "Filing 1023",
        index: 6,
        sequence: 1006,
        href: "/accelerator/class/electives/module/6",
      },
    ]

    const ordered = sortAcceleratorModules(modules)
    expect(ordered.map((module) => module.slug)).toEqual([
      "naming-your-nfp",
      "nfp-registration",
      "filing-1023",
      "start-with-your-why",
    ])
  })

  it("orders add-on electives after core curriculum modules", () => {
    const modules: TestModule[] = [
      {
        slug: "theory-of-change",
        title: "Theory of Change",
        index: 1,
        sequence: 2,
        href: "/accelerator/class/theory-of-change/module/1",
      },
      {
        slug: "financial-handbook",
        title: "Financial Handbook",
        index: 1,
        sequence: 9000,
        href: "/accelerator/class/electives/module/1",
      },
      {
        slug: "due-diligence",
        title: "Due Diligence",
        index: 2,
        sequence: 9001,
        href: "/accelerator/class/electives/module/2",
      },
      {
        slug: "retention-and-security",
        title: "Retention and Security",
        index: 3,
        sequence: 9002,
        href: "/accelerator/class/electives/module/3",
      },
    ]

    const ordered = sortAcceleratorModules(modules)
    expect(ordered.map((module) => module.slug)).toEqual([
      "theory-of-change",
      "financial-handbook",
      "due-diligence",
      "retention-and-security",
    ])
  })

  it("recognizes legacy Formation ordering by electives module index fallback", () => {
    const modules: TestModule[] = [
      {
        slug: "formation-step-6",
        title: "Formation Step 6",
        index: 6,
        href: "/accelerator/class/electives/module/6",
      },
      {
        slug: "formation-step-4",
        title: "Formation Step 4",
        index: 4,
        href: "/accelerator/class/electives/module/4",
      },
      {
        slug: "formation-step-5",
        title: "Formation Step 5",
        index: 5,
        href: "/accelerator/class/electives/module/5",
      },
      {
        slug: "start-with-your-why",
        title: "Start with your why",
        index: 2,
        href: "/accelerator/class/strategic-foundations/module/2",
      },
    ]

    const ordered = sortAcceleratorModules(modules)
    expect(ordered.map((module) => module.slug)).toEqual([
      "formation-step-4",
      "formation-step-5",
      "formation-step-6",
      "start-with-your-why",
    ])
  })

  it("keeps named Formation modules first even when legacy index ordering is reversed", () => {
    const modules: TestModule[] = [
      {
        slug: "naming-your-nfp",
        title: "Naming your NFP",
        index: 1,
        href: "/accelerator/class/electives/module/1",
      },
      {
        slug: "nfp-registration",
        title: "NFP Registration",
        index: 2,
        href: "/accelerator/class/electives/module/2",
      },
      {
        slug: "filing-1023",
        title: "Filing 1023",
        index: 3,
        href: "/accelerator/class/electives/module/3",
      },
      {
        slug: "financial-handbook",
        title: "Financial Handbook",
        index: 4,
        href: "/accelerator/class/electives/module/4",
      },
      {
        slug: "due-diligence",
        title: "Due Diligence",
        index: 5,
        href: "/accelerator/class/electives/module/5",
      },
      {
        slug: "retention-and-security",
        title: "Retention and Security",
        index: 6,
        href: "/accelerator/class/electives/module/6",
      },
    ]

    const ordered = sortAcceleratorModules(modules)
    expect(ordered.map((module) => module.slug)).toEqual([
      "naming-your-nfp",
      "nfp-registration",
      "filing-1023",
      "financial-handbook",
      "due-diligence",
      "retention-and-security",
    ])
  })
})
