import { describe, expect, it } from "vitest"

import { resolveBrandKitReadiness } from "@/features/workspace-brand-kit/lib/brand-kit-readiness"
import {
  resolveBrandManifest,
  resolveBrandPalette,
} from "@/features/workspace-brand-kit/lib/brand-kit-export"
import { createZipArchive } from "@/lib/files/simple-zip"

describe("workspace-brand-kit", () => {
  it("derives readiness from the saved profile basics", () => {
    const inProgress = resolveBrandKitReadiness({
      name: "Coach House",
      boilerplate: "Support for founders.",
      logoUrl: "https://example.com/logo.png",
    })

    expect(inProgress.status).toBe("in-progress")
    expect(inProgress.completedCount).toBe(2)

    const ready = resolveBrandKitReadiness({
      name: "Coach House",
      boilerplate: "Support for founders.",
      logoUrl: "https://example.com/logo.png",
      brandPrimary: "#0F172A",
      brandTypography: {
        headings: {
          family: "Space Grotesk",
          weight: "600",
          tracking: "normal",
        },
        body: {
          family: "IBM Plex Sans",
          weight: "400",
          tracking: "normal",
        },
        code: {
          family: "IBM Plex Mono",
        },
      },
    })

    expect(ready.status).toBe("ready")
  })

  it("builds a palette with the primary color first and caps supporting colors", () => {
    const palette = resolveBrandPalette({
      brandPrimary: "#0f172a",
      brandColors: ["#0F172A", "#F59E0B", "#14B8A6", "#F43F5E", "#8B5CF6", "#22C55E"],
    })

    expect(palette).toEqual(["#0F172A", "#F59E0B", "#14B8A6", "#F43F5E", "#8B5CF6"])
  })

  it("resolves a download manifest with preset metadata", () => {
    const { manifest, preset } = resolveBrandManifest({
      name: "Coach House",
      tagline: "Build a durable organization",
      boilerplate: "A shared operating system for nonprofit builders.",
      brandPrimary: "#0F172A",
      brandColors: ["#F59E0B"],
      brandThemePresetId: "skyline",
      brandAccentPresetId: "sky",
      brandTypographyPresetId: "modern-grotesk",
      brandTypography: {
        headings: {
          family: "Space Grotesk",
          weight: "600",
          tracking: "normal",
        },
        body: {
          family: "IBM Plex Sans",
          weight: "400",
          tracking: "normal",
        },
        code: {
          family: "IBM Plex Mono",
        },
      },
    })

    expect(manifest.name).toBe("Coach House")
    expect(manifest.palette).toEqual(["#0F172A", "#F59E0B"])
    expect(manifest.brandThemePresetId).toBe("skyline")
    expect(manifest.brandAccentPresetId).toBe("sky")
    expect(manifest.typographyPresetLabel).toBe("Modern Grotesk")
    expect(manifest.brandTypography?.code.family).toBe("IBM Plex Mono")
    expect(preset?.headingFontLabel).toBe("Space Grotesk")
  })

  it("creates a valid zip archive header for brand-kit exports", () => {
    const archive = createZipArchive([
      { name: "brand/brand.txt", data: "hello" },
      { name: "README.txt", data: "world" },
    ])

    expect(archive.subarray(0, 4).toString("hex")).toBe("504b0304")
    expect(archive.includes(Buffer.from("README.txt"))).toBe(true)
  })
})
