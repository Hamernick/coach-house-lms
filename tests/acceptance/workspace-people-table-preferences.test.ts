import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildWorkspacePeopleTablePreferencesStorageKey,
  normalizeWorkspacePeopleTablePreferences,
  readWorkspacePeopleTablePreferences,
  writeWorkspacePeopleTablePreferences,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-overlay-people-table-preferences"

function stubLocalStorage(initial: Record<string, string> = {}) {
  const storage = new Map(Object.entries(initial))
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value)
      }),
    },
  })
  return storage
}

describe("workspace People table preferences", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("scopes one preference record to the organization and viewer", () => {
    expect(
      buildWorkspacePeopleTablePreferencesStorageKey({
        orgId: "org 1",
        viewerId: "user@example.com",
      })
    ).toBe(
      "coachhouse:workspace-board-ui:v1:org%201:user%40example.com:people-table:v2"
    )
  })

  it("normalizes saved table layout values", () => {
    const preferences = normalizeWorkspacePeopleTablePreferences({
      columnSizing: { person: 9999, role: 10 },
      contentMode: "truncate",
      rowHeight: "spacious",
      rowSizing: { "person-1": 999, "person-2": "invalid" },
      savedColumnSizing: { person: 300 },
    })

    expect(preferences.columnSizing.person).toBe(480)
    expect(preferences.columnSizing.role).toBe(112)
    expect(preferences.contentMode).toBe("truncate")
    expect(preferences.rowHeight).toBe("spacious")
    expect(preferences.rowSizing).toEqual({ "person-1": 160 })
    expect(preferences.savedColumnSizing?.person).toBe(300)
  })

  it("keeps preferences isolated between workspace scopes", () => {
    stubLocalStorage()
    const firstScope = { orgId: "org-1", viewerId: "viewer-1" }
    const secondScope = { orgId: "org-2", viewerId: "viewer-1" }

    writeWorkspacePeopleTablePreferences(firstScope, {
      columnSizing: { person: 320 },
      contentMode: "truncate",
      rowHeight: "compact",
      rowSizing: { "person-1": 88 },
      savedColumnSizing: { person: 300 },
    })

    expect(readWorkspacePeopleTablePreferences(firstScope)).toMatchObject({
      contentMode: "truncate",
      rowHeight: "compact",
      rowSizing: { "person-1": 88 },
    })
    expect(
      readWorkspacePeopleTablePreferences(firstScope).columnSizing.person
    ).toBe(320)
    expect(readWorkspacePeopleTablePreferences(secondScope)).toMatchObject({
      contentMode: "wrap",
      rowHeight: "standard",
      rowSizing: {},
      savedColumnSizing: null,
    })
    expect(
      readWorkspacePeopleTablePreferences(secondScope).columnSizing.person
    ).toBe(216)
  })

  it("claims unscoped legacy preferences for only the current workspace", () => {
    const storage = stubLocalStorage({
      "coachhouse:workspace-people-table:column-sizing:v1": JSON.stringify({
        person: 360,
      }),
      "coachhouse:workspace-people-table:content-mode:v1": "truncate",
      "coachhouse:workspace-people-table:row-height:v1": "compact",
    })
    const currentScope = { orgId: "org-1", viewerId: "viewer-1" }
    const otherScope = { orgId: "org-2", viewerId: "viewer-2" }

    expect(readWorkspacePeopleTablePreferences(currentScope)).toMatchObject({
      contentMode: "truncate",
      rowHeight: "compact",
    })
    expect(
      readWorkspacePeopleTablePreferences(currentScope).columnSizing.person
    ).toBe(360)
    expect(
      storage.has(buildWorkspacePeopleTablePreferencesStorageKey(currentScope))
    ).toBe(true)
    expect(readWorkspacePeopleTablePreferences(otherScope).contentMode).toBe(
      "wrap"
    )
    expect(
      storage.has(buildWorkspacePeopleTablePreferencesStorageKey(otherScope))
    ).toBe(false)
  })
})
