import { describe, expect, it } from "vitest"

import {
  assertVisualBaselineEnvironment,
  VISUAL_BASELINE_ENVIRONMENT,
} from "../../scripts/visual-baseline-environment.mjs"

describe("visual baseline environment", () => {
  it("accepts the hosted visual environment", () => {
    expect(() =>
      assertVisualBaselineEnvironment({ ...VISUAL_BASELINE_ENVIRONMENT })
    ).not.toThrow()
  })

  it.each([
    [{ platform: "darwin" }, "platform"],
    [{ platform: "win32" }, "platform"],
    [{ arch: "arm64" }, "arch"],
    [{ distribution: "debian" }, "distribution"],
    [{ distributionVersion: "22.04" }, "distributionVersion"],
    [{ distributionVersion: null }, "distributionVersion"],
    [{ playwrightVersion: "1.59.0" }, "playwrightVersion"],
  ])("rejects unsupported %s", (difference, field) => {
    expect(() =>
      assertVisualBaselineEnvironment({
        ...VISUAL_BASELINE_ENVIRONMENT,
        ...difference,
      })
    ).toThrow(`Found ${field}:`)
  })
})
