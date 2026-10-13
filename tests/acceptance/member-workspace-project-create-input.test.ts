import { describe, expect, it } from "vitest"

import { defaultProjectOrganizationId } from "@/features/member-workspace/lib/project-organization"
import { normalizeMemberWorkspaceCreateProjectInput } from "@/features/member-workspace/server/project-create-input"

describe("normalizeMemberWorkspaceCreateProjectInput", () => {
  it("normalizes project form input into persisted project fields", () => {
    const result = normalizeMemberWorkspaceCreateProjectInput({
      name: "  Volunteer onboarding revamp  ",
      status: "planned",
      priority: "medium",
      startDate: "2026-04-07",
      endDate: "2026-05-05",
      clientName: "  Community Partners ",
      typeLabel: " Operations ",
      tags: " Community, Ops, Ops ",
      memberLabels: " Jason Reed, Amina Clark ",
    })

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Volunteer onboarding revamp",
        description: null,
        overviewDocumentHtml: null,
        hasOverviewDocumentHtml: false,
        status: "planned",
        priority: "medium",
        startDate: "2026-04-07",
        endDate: "2026-05-05",
        clientName: "Community Partners",
        typeLabel: "Operations",
        durationLabel: "4 weeks",
        tags: ["Community", "Ops"],
        memberLabels: ["Jason Reed", "Amina Clark"],
      },
    })
  })

  it("rejects projects whose end date is before the start date", () => {
    expect(
      normalizeMemberWorkspaceCreateProjectInput({
        name: "Broken schedule",
        status: "planned",
        priority: "medium",
        startDate: "2026-05-05",
        endDate: "2026-04-07",
      }),
    ).toEqual({
      ok: false,
      error: "End date must be on or after the start date.",
    })
  })
  it("preserves edited labels, colors, and deleted option lists", () => {
    const optionSettings = { tags: [], sprintTypes: [{ id: "design", label: "Planning", color: "#2563eb" }] }
    const result = normalizeMemberWorkspaceCreateProjectInput({ name: "Project", status: "planned", priority: "medium", startDate: "2026-09-20", endDate: "2026-09-21", typeLabel: "Planning", optionSettings })
    expect(result).toMatchObject({ ok: true, value: { optionSettings, typeLabel: "Planning", tags: [] } })
  })
  it.each([
    { tags: [{ id: "one", label: "Tag", color: "url(evil)" }], sprintTypes: [] },
    { tags: [{ id: "one", label: "Tag" }, { id: "two", label: "tag" }], sprintTypes: [] },
    { tags: [{ id: "one", label: "two,tags" }], sprintTypes: [] },
  ])("rejects invalid option colors and ambiguous names", (optionSettings) => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ name: "Project", status: "planned", priority: "medium", startDate: "2026-09-20", endDate: "2026-09-21", optionSettings })).toMatchObject({ ok: false })
  })

})

describe("project recurrence input", () => {
  const input = { name: "Monthly finance", status: "planned" as const, priority: "medium" as const, startDate: "2027-01-01", endDate: "2027-01-31" }
  it.each(["monthly", "none"] as const)("accepts %s recurrence", (recurrence) => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ ...input, recurrence })).toMatchObject({ ok: true, value: { recurrence } })
  })
  it("rejects unsupported recurrence", () => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ ...input, recurrence: "daily" as "monthly" })).toMatchObject({ ok: false })
  })
  it("rejects nonexistent dates instead of rolling them into the next month", () => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ ...input, startDate: "2027-02-30", endDate: "2027-03-05" })).toMatchObject({ ok: false })
  })
})

describe("optional project fields", () => {
  const base = { name: "Internal planning", status: "planned" as const, priority: "medium" as const }
  it.each([
    [undefined, undefined, null, null],
    ["", "", null, null],
    ["2026-10-01", "", "2026-10-01", null],
    ["", "2026-10-31", null, "2026-10-31"],
  ])("retains omitted or partial dates without inventing a schedule", (startDate, endDate, start, end) => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ ...base, startDate, endDate })).toMatchObject({ ok: true, value: { startDate: start, endDate: end, durationLabel: null } })
  })
  it("still rejects invalid dates when the other date is missing", () => {
    expect(normalizeMemberWorkspaceCreateProjectInput({ ...base, endDate: "2026-02-30" })).toMatchObject({ ok: false })
  })
  it("defaults to Coach House instead of the first organization", () => {
    expect(defaultProjectOrganizationId([{ orgId: "first", name: "Acme" }, { orgId: "coach-house", name: "Coach House Solutions Group" }])).toBe("coach-house")
    expect(defaultProjectOrganizationId([{ orgId: "first", name: "Acme" }])).toBeUndefined()
  })
})
