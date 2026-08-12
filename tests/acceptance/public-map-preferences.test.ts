import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { canLoadRemotePublicMapPreferences } from "@/components/public/public-map-index/use-public-map-preferences"

describe("public map preferences", () => {
  it("saves map preferences without showing a transient activity pill", () => {
    const surfaceSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/map-surface.tsx"
      ),
      "utf8"
    )
    const preferencesSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/use-public-map-preferences.ts"
      ),
      "utf8"
    )
    const actionsSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/use-public-map-actions.ts"
      ),
      "utf8"
    )

    expect(surfaceSource).not.toContain("Saving map activity")
    expect(surfaceSource).not.toContain("isSavingPreferences")
    expect(preferencesSource).toContain('method: "PATCH"')
    expect(preferencesSource).toContain("COLLECTED_RESOURCES_STORAGE_KEY")
    expect(preferencesSource).toContain(
      'if (preferenceMode === "unknown" || preferenceMode === "authenticated")'
    )
    expect(preferencesSource).toContain(
      'if (preferenceMode === "unknown") return'
    )
    expect(actionsSource).not.toContain("setAuthSheetOpen")
  })

  it("skips remote preference loading for signed-out visitors", () => {
    expect(canLoadRemotePublicMapPreferences(null)).toBe(false)
    expect(canLoadRemotePublicMapPreferences({ id: "", email: null })).toBe(
      false
    )
  })

  it("allows remote preference loading for authenticated viewers", () => {
    expect(
      canLoadRemotePublicMapPreferences({
        id: "viewer_123",
        email: "member@example.com",
      })
    ).toBe(true)
  })
})
