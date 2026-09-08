import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { themeTextColor } from "@/lib/markdown/theme-colors"

describe("sanitizeHtml", () => {
  it("removes encoded script URLs and executable markup", () => {
    const sanitized = sanitizeHtml(
      [
        '<a href="javascript&colon;alert(1)">named entity</a>',
        '<a href="java&#x73;cript&colon;alert(2)">mixed entities</a>',
        '<a href="java&Tab;script&colon;alert(3)">embedded control</a>',
        '<img src="data:text/html;base64,PHNjcmlwdD4=" onerror="alert(4)">',
        '<svg><a xlink:href="javascript:alert(5)">svg</a></svg>',
        "<script>alert(6)</script>",
      ].join("")
    )

    expect(sanitized).not.toMatch(/javascript/i)
    expect(sanitized).not.toMatch(/data:text\/html/i)
    expect(sanitized).not.toMatch(/onerror/i)
    expect(sanitized).not.toMatch(/<script|<svg|xlink:href/i)
  })

  it("preserves supported rich text and safe links", () => {
    const richText =
      '<h2 style="text-align: center">Purpose</h2><p><strong>Serve</strong> <u>neighbors</u>.</p><ul class="list-disc"><li><a class="text-primary underline underline-offset-2" href="https://example.com/help">Get help</a></li></ul><table><tbody><tr><th colspan="2">Plan</th></tr><tr><td>One</td><td>Two</td></tr></tbody></table><img src="https://example.com/photo.jpg" alt="Volunteers">'

    const sanitized = sanitizeHtml(richText)

    expect(sanitized).toContain('<h2 style="text-align:center">Purpose</h2>')
    expect(sanitized).toContain("<strong>Serve</strong>")
    expect(sanitized).toContain("<u>neighbors</u>")
    expect(sanitized).toContain('href="https://example.com/help"')
    expect(sanitized).toContain("<table>")
    expect(sanitized).toContain('colspan="2"')
    expect(sanitized).toContain('src="https://example.com/photo.jpg"')
    expect(sanitized).toContain('alt="Volunteers"')
  })

  it("rejects alternate URL and CSS bypasses while preserving accepted URLs", () => {
    const sanitized = sanitizeHtml(
      [
        '<a href="jav&#x0a;ascript:alert(1)">newline</a>',
        '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&colon;alert(2)">decimal</a>',
        '<a href="data:text/html,<script>alert(3)</script>">data</a>',
        '<span style="background-image:url(javascript:alert(4));color:#123456">styled</span>',
        '<a href="/roadmap">relative</a>',
        '<a href="#section">fragment</a>',
        '<a href="mailto:hello@example.com">email</a>',
        '<a href="tel:+13125550100">call</a>',
      ].join("")
    )

    expect(sanitized).not.toMatch(/href="(?:javascript|data:)/i)
    expect(sanitized).not.toContain("background-image")
    expect(sanitized).toContain(`color:${themeTextColor("#123456")}`)
    expect(sanitized).toContain('href="/roadmap"')
    expect(sanitized).toContain('href="#section"')
    expect(sanitized).toContain('href="mailto:hello@example.com"')
    expect(sanitized).toContain('href="tel:+13125550100"')
  })

  it("retains safe pasted text styles while normalizing block styles", () => {
    const sanitized = sanitizeHtml(
      [
        '<h2 style="color:#000;background-color:#fff;text-align:center">Vision</h2>',
        '<p><span style="color:inherit;font-size:18px"><strong>Visible</strong> in every theme.</span></p>',
        '<mark style="background-color:#ffff00">Highlighted text</mark>',
        '<ul><li><a href="https://example.com">Useful link</a></li></ul>',
        '<img src="https://example.com/vision.jpg" alt="Vision workshop">',
      ].join("")
    )

    expect(sanitized).toContain('<h2 style="text-align:center">Vision</h2>')
    expect(sanitized).toContain("<strong>Visible</strong>")
    expect(sanitized).toContain("Highlighted text")
    expect(sanitized).toContain("<ul><li>")
    expect(sanitized).toContain('href="https://example.com"')
    expect(sanitized).toContain('alt="Vision workshop"')
    expect(sanitized).toContain("color:inherit;font-size:18px")
    expect(sanitized).not.toMatch(/<mark|background-color/i)
  })

  it("registers supported text styles for formatted paste", () => {
    const extensionsSource = readFileSync(
      "src/components/rich-text-editor/extensions.ts",
      "utf8"
    )

    expect(extensionsSource).toContain("@tiptap/extension-text-style")
    expect(extensionsSource).toContain("TextStyleKit.configure")
  })
})

describe("theme-compatible pasted colors", () => {
  it.each([
    "black",
    "white",
    "#000",
    "#fff",
    "#222222",
    "rgb(12, 12, 12)",
    "hsl(0, 0%, 90%)",
  ])("makes %s follow the theme", (color) => {
    expect(themeTextColor(color)).toBe("inherit")
    expect(themeTextColor(color, "highlight")).toBe("transparent")
  })
  it.each([
    "red",
    "#0066cc",
    "rgb(180, 20, 30)",
    "hsl(270, 70%, 50%)",
    "rgb(0% 40% 80%)",
  ])("retains an adaptive accent for %s across sanitization", (color) => {
    const html = sanitizeHtml(
      `<p><span style="color:${color};background-color:#ffff00;font-size:18px">Styled</span></p>`
    )
    expect(html).toContain("color:light-dark(")
    expect(html).toContain("background-color:light-dark(")
    expect(sanitizeHtml(html)).toBe(html)
  })
  it("keeps canonical browser color serialization and rejects unreadable or executable overrides", () => {
    const adapted = themeTextColor("#aa2020")
    const serialized = adapted.replace(
      /#([a-f0-9]{6})/g,
      (_, hex) =>
        `rgb(${[0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`
    )
    expect(themeTextColor(serialized)).toBe(adapted)
    for (const value of [
      "light-dark(#000000, #000000)",
      "var(--unknown)",
      "url(https://example.com)",
      "expression(alert(1))",
    ]) {
      expect(themeTextColor(value)).toBe("inherit")
    }
    expect(themeTextColor("rgba(255,0,0,0)", "highlight")).toBe("transparent")
  })
})
