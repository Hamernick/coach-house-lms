import { describe, expect, it } from "vitest"

import { extractProviderPageSignals } from "../../scripts/resource-map/lib/provider-page-signals.mjs"

describe("resource-map provider page signals", () => {
  it("retains provider-linked social, contact, service-page, and media evidence", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <html>
          <head>
            <meta property="og:image" content="/media/share.jpg">
          </head>
          <body>
            <img src="/media/logo.svg" alt="Provider logo">
            <a href="/find-support">Find support</a>
            <a href="/programs/family-care">Programs</a>
            <a href="/blog">News and blog</a>
            <a href="https://www.instagram.com/provider/">Instagram</a>
            <a href="mailto:help@provider.example.org">Email us</a>
            <a href="tel:+13125550100">Call</a>
            <p>Questions: support@provider.example.org or (312) 555-0199.</p>
            <a href="https://unrelated.example.net/services">Other site</a>
            <a href="context.submission.url">Broken form action</a>
            <a href="context.item.anchor">Broken form anchor</a>
            <a href='""'>Broken empty form action</a>
          </body>
        </html>
      `,
    })

    expect(signals.socialAccounts).toEqual([
      expect.objectContaining({
        platform: "instagram",
        providerLinked: true,
        url: "https://www.instagram.com/provider/",
      }),
    ])
    expect(signals.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "email",
          value: "help@provider.example.org",
        }),
        expect.objectContaining({ type: "phone", value: "+13125550100" }),
        expect.objectContaining({
          type: "email",
          value: "support@provider.example.org",
          sourceMethod: "page_text",
        }),
        expect.objectContaining({
          type: "phone",
          value: "(312) 555-0199",
          sourceMethod: "page_text",
        }),
      ])
    )
    expect(signals.evidenceLinkCandidates.map((item) => item.url)).toEqual([
      "https://provider.example.org/find-support",
      "https://provider.example.org/programs/family-care",
    ])
    expect(signals.imageCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "open_graph_image",
          publishable: false,
          url: "https://provider.example.org/media/share.jpg",
        }),
        expect.objectContaining({
          kind: "logo_candidate",
          publishable: false,
          url: "https://provider.example.org/media/logo.svg",
        }),
      ])
    )
  })

  it("deduplicates repeated signals and caps provider-linked evidence", () => {
    const repeated = Array.from(
      { length: 30 },
      (_, index) =>
        `<a href="/services/${index}">Service ${index}</a><a href="https://x.com/provider">X</a>`
    ).join("")
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: repeated,
    })

    expect(signals.evidenceLinkCandidates).toHaveLength(20)
    expect(signals.socialAccounts).toHaveLength(1)
  })

  it("deduplicates social URLs with optional trailing slashes", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <a href="https://www.instagram.com/provider">Instagram</a>
        <a href="https://www.instagram.com/provider/">Instagram again</a>
      `,
    })

    expect(signals.socialAccounts).toHaveLength(1)
  })

  it("rejects script-only contacts, placeholder emails, and null media URLs", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <html>
          <head>
            <meta property="og:image" content="null">
            <script>const payload = { phone: "2535267336", email: "hidden@provider.org" }</script>
          </head>
          <body>
            <p>Template: user@domain.com</p>
            <p>Host template: filler@godaddy.com</p>
            <p>Call (312) 555-0199.</p>
            <a href="tel:(603)%20225-3295">Call our office</a>
          </body>
        </html>
      `,
    })

    expect(signals.contacts).toEqual([
      expect.objectContaining({ type: "phone", value: "(603) 225-3295" }),
      expect.objectContaining({ type: "phone", value: "(312) 555-0199" }),
    ])
    expect(signals.imageCandidates).toEqual([])
  })

  it("rejects platform roots and sharing links as social accounts", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <a href="https://twitter.com/">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php">Share</a>
        <a href="https://www.facebook.com/profile.php?id=123">Legacy profile</a>
        <a href="https://www.linkedin.com/in/site-designer/">Designer</a>
        <a href="https://www.linkedin.com/company/provider/">LinkedIn</a>
      `,
    })

    expect(signals.socialAccounts).toEqual([
      expect.objectContaining({
        platform: "linkedin",
        url: "https://www.linkedin.com/company/provider/",
      }),
    ])
  })

  it("decodes numeric HTML entities before deduplicating contacts", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <a href="mailto:help&#64;provider&#x2e;org">Email</a>
        <p>help@provider.org</p>
      `,
    })

    expect(signals.contacts).toEqual([
      expect.objectContaining({ type: "email", value: "help@provider.org" }),
    ])
  })

  it("deduplicates US phone numbers with an optional country code", () => {
    const signals = extractProviderPageSignals({
      url: "https://provider.example.org/",
      html: `
        <a href="tel:+1(919) 670-3622">Call</a>
        <p>Phone: 919-670-3622</p>
      `,
    })

    expect(signals.contacts).toHaveLength(1)
  })
})
