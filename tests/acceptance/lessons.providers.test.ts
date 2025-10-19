import { describe, it, expect } from "vitest"
import { inferProviderSlug } from "@/lib/lessons/providers"

describe("inferProviderSlug", () => {
  it("maps known hosts", () => {
    expect(inferProviderSlug("https://www.youtube.com/watch?v=abc")).toBe("youtube")
    expect(inferProviderSlug("https://youtu.be/xyz")).toBe("youtube")
    expect(inferProviderSlug("https://drive.google.com/file/d/123")).toBe("google-drive")
    expect(inferProviderSlug("https://dropbox.com/s/123")).toBe("dropbox")
    expect(inferProviderSlug("https://loom.com/share/123")).toBe("loom")
    expect(inferProviderSlug("https://vimeo.com/123")).toBe("vimeo")
    expect(inferProviderSlug("https://notion.so/page")).toBe("notion")
    expect(inferProviderSlug("https://figma.com/file/123")).toBe("figma")
  })

  it("returns generic for unknown or invalid URLs", () => {
    expect(inferProviderSlug("https://example.com")).toBe("generic")
    expect(inferProviderSlug("")).toBe("generic")
    expect(inferProviderSlug("not a url")).toBe("generic")
    expect(inferProviderSlug(null)).toBe("generic")
    expect(inferProviderSlug(undefined)).toBe("generic")
  })
})

