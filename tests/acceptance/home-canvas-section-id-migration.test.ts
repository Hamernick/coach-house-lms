import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "font-inter", variable: "--font-inter" }),
  Sora: () => ({ className: "font-sora", variable: "--font-sora" }),
  Space_Grotesk: () => ({ className: "font-space-grotesk", variable: "--font-space-grotesk" }),
}))

import { parseInitialSection, resolveSectionAlias } from "@/components/public/home-canvas-preview-config"

describe("home-canvas section id migration", () => {
  it("uses platform as the canonical section id", () => {
    expect(parseInitialSection("platform")).toBe("platform")
  })

  it("maps legacy offerings id to platform", () => {
    expect(resolveSectionAlias("offerings")).toBe("platform")
    expect(parseInitialSection("offerings")).toBe("platform")
  })

  it("falls back to hero for unknown section ids", () => {
    expect(parseInitialSection("unknown")).toBe("hero")
  })
})
