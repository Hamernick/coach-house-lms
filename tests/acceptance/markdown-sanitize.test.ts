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
    expect(sanitized).toContain('style="color:#123456"')
    expect(sanitized).toContain('href="/roadmap"')
    expect(sanitized).toContain('href="#section"')
    expect(sanitized).toContain('href="mailto:hello@example.com"')
    expect(sanitized).toContain('href="tel:+13125550100"')
  })
})
