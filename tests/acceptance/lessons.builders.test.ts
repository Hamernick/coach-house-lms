import { describe, it, expect } from "vitest"
import { buildAssignmentSchema, buildResourcePayload } from "@/lib/lessons/builders"

describe("lessons builders", () => {
  it("buildResourcePayload merges lesson links and module resources", () => {
    const resources = [
      { title: "R1", url: "https://r1" },
      { title: "", url: "https://r2" },
      { title: "", url: "" },
    ]
    const links = [
      { title: "L1", url: "https://l1" },
      { title: "", url: "https://l2" },
    ]
    const out = buildResourcePayload(resources as any, links as any)
    expect(out).toEqual([
      { label: "L1", url: "https://l1" },
      { label: "https://l2", url: "https://l2" },
      { label: "R1", url: "https://r1" },
      { label: "https://r2", url: "https://r2" },
    ])
  })

  it("buildAssignmentSchema normalizes subtitle and slider fields", () => {
    const fields = [
      { label: "Intro", type: "subtitle" },
      { label: "Satisfaction", type: "slider", min: 1, max: 5, step: 1 },
      { label: "Colors", type: "multi_select", options: [" red ", "", " blue "] },
      { label: "Budget", type: "budget_table", options: [" Staff ", " Supplies "] },
    ]
    const schema = buildAssignmentSchema(fields as any)
    expect(schema).not.toBeNull()
    const names = (schema!.fields as any[]).map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
    expect(schema!.fields[0]).toMatchObject({ type: "display", variant: "subtitle", label: "Intro" })
    expect(schema!.fields[1]).toMatchObject({ type: "slider", min: 1, max: 5, step: 1 })
    const multi = schema!.fields.find((f: any) => f.type === "multi_select") as any
    expect(multi.options).toEqual(["red", "blue"])
    const budget = schema!.fields.find((f: any) => f.type === "budget_table") as any
    expect(budget.rows).toEqual([
      {
        category: "Staff",
        description: "",
        costType: "",
        unit: "",
        units: "",
        costPerUnit: "",
        totalCost: "",
      },
      {
        category: "Supplies",
        description: "",
        costType: "",
        unit: "",
        units: "",
        costPerUnit: "",
        totalCost: "",
      },
    ])
  })
})
