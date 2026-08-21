import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { sanitizeHtml } from "@/lib/markdown/sanitize"

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
    expect(sanitized).not.toMatch(/(?:background-)?color/i)
    expect(sanitized).toContain("<span>styled</span>")
    expect(sanitized).toContain('href="/roadmap"')
    expect(sanitized).toContain('href="#section"')
    expect(sanitized).toContain('href="mailto:hello@example.com"')
    expect(sanitized).toContain('href="tel:+13125550100"')
  })

  it("removes pasted theme colors without flattening rich text", () => {
    const sanitized = sanitizeHtml(
      [
        '<h2 style="color:#000;background-color:#fff;text-align:center">Vision</h2>',
        '<p><span style="color:rgb(0, 0, 0);font-size:18px"><strong>Visible</strong> in every theme.</span></p>',
        '<mark style="background-color:#ffff00">Highlighted text</mark>',
        '<ul><li><a href="https://example.com">Useful link</a></li></ul>',
        '<img src="https://example.com/vision.jpg" alt="Vision workshop">',
      ].join("")
    )

    expect(sanitized).toContain(
      '<h2 style="text-align:center">Vision</h2>'
    )
    expect(sanitized).toContain("<strong>Visible</strong>")
    expect(sanitized).toContain("Highlighted text")
    expect(sanitized).toContain("<ul><li>")
    expect(sanitized).toContain('href="https://example.com"')
    expect(sanitized).toContain('alt="Vision workshop"')
    expect(sanitized).not.toMatch(/(?:background-)?color|font-size|<mark/i)
  })

  it("does not register free-form color parsing in the rich text editor", () => {
    const extensionsSource = readFileSync(
      "src/components/rich-text-editor/extensions.ts",
      "utf8"
    )

    expect(extensionsSource).not.toMatch(
      /extension-(?:color|highlight|text-style)/
    )
    expect(extensionsSource).not.toMatch(/\b(?:Color|Highlight|TextStyle),/)
  })
})
