import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { shouldResetWorkspaceOntologyLayoutScene } from "../../src/features/workspace-ontology/hooks/use-workspace-ontology-layout-scene"

describe("workspace ontology layout scene enablement", () => {
  it("resets once when disabled and re-arms after enablement", () => {
    let previouslyEnabled = false
    const resets = [false, false, true, true, false, false, true, false].map(
      (enabled) => {
        const shouldReset = shouldResetWorkspaceOntologyLayoutScene(
          previouslyEnabled,
          enabled
        )
        previouslyEnabled = enabled
        return shouldReset
      }
    )

    expect(resets).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
    ])
  })

  it("guards fresh disabled-state writes behind the transition reset", () => {
    const source = readFileSync(
      "src/features/workspace-ontology/hooks/use-workspace-ontology-layout-scene.ts",
      "utf8"
    )
    const disabledBranch = source.slice(
      source.indexOf("if (!enabled) {"),
      source.indexOf("const requestId =")
    )

    expect(disabledBranch).toContain("if (!shouldResetDisabledScene) return")
    expect(
      disabledBranch.indexOf("if (!shouldResetDisabledScene) return")
    ).toBeLessThan(disabledBranch.indexOf("setLayoutNodes([])"))
  })
})
