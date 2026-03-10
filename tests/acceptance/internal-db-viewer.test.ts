import { describe, expect, it } from "vitest"
import {
  resolveInternalDbViewerAllowedEmails,
  resolveInternalDbViewerRowLimit,
  resolveInternalDbViewerSelectedTable,
  resolveInternalDbViewerTables,
} from "@/features/internal-db-viewer/lib"

describe("internal-db-viewer feature contract", () => {
  it("parses and normalizes allowlisted emails", () => {
    const emails = resolveInternalDbViewerAllowedEmails(" A@Example.com, b@example.com ,a@example.com ")
    expect([...emails]).toEqual(["a@example.com", "b@example.com"])
  })

  it("filters configured tables and falls back safely", () => {
    expect(resolveInternalDbViewerTables("organizations,profiles,not_a_table")).toEqual([
      "organizations",
      "profiles",
    ])
    expect(resolveInternalDbViewerTables("not_a_table")).toEqual(["organizations"])
  })

  it("resolves selected table and row limit from user params safely", () => {
    const allowedTables = resolveInternalDbViewerTables("organizations,profiles")
    expect(resolveInternalDbViewerSelectedTable({ allowedTables, candidate: "profiles" })).toBe("profiles")
    expect(resolveInternalDbViewerSelectedTable({ allowedTables, candidate: "unknown" })).toBe("organizations")

    expect(resolveInternalDbViewerRowLimit("25")).toBe(25)
    expect(resolveInternalDbViewerRowLimit("5000")).toBe(100)
    expect(resolveInternalDbViewerRowLimit("bad")).toBe(50)
  })
})
