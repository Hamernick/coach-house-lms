import { describe, expect, it } from "vitest"

import { buildReadinessChecklist } from "@/lib/accelerator/readiness-checklist"

describe("readiness checklist link resolution", () => {
  it("maps dynamic formation and roadmap reasons to next-step links", () => {
    const checklist = buildReadinessChecklist({
      reasons: ["Complete formation lessons", "Complete core roadmap sections"],
      nextFormationModuleHref: "/accelerator/class/formation/module/2",
      nextCoreRoadmapHref: "/accelerator/roadmap/theory-of-change",
    })

    expect(checklist).toEqual([
      { href: "/accelerator/class/formation/module/2", label: "Complete formation lessons" },
      { href: "/accelerator/roadmap/theory-of-change", label: "Complete core roadmap sections" },
    ])
  })

  it("uses stable fallbacks and limits items", () => {
    const checklist = buildReadinessChecklist({
      reasons: [
        "Complete formation lessons",
        "Complete core roadmap sections",
        "Upload verification letter",
        "Set a program funding goal",
      ],
      maxItems: 3,
    })

    expect(checklist).toEqual([
      { href: "/accelerator/class/formation/module/1", label: "Complete formation lessons" },
      { href: "/accelerator/roadmap/origin-story", label: "Complete core roadmap sections" },
      { href: "/my-organization/documents", label: "Upload verification letter" },
    ])
  })

  it("drops unknown reasons and deduplicates repeated entries", () => {
    const checklist = buildReadinessChecklist({
      reasons: ["Unknown reason", "Upload legal formation document", "Upload legal formation document"],
    })

    expect(checklist).toEqual([{ href: "/my-organization/documents", label: "Upload legal document" }])
  })
})
