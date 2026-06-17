import { readFileSync } from "node:fs"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  buildEmailOpsDashboardInput,
  findEmailOpsCampaign,
  normalizeEmailOpsTestSendInput,
  renderEmailOpsMarkdownHtml,
  renderEmailOpsMarkdownText,
  resolveEmailOpsProviderStatus,
} from "@/features/email-ops"
import {
  createEmailPreferenceToken,
  verifyEmailPreferenceToken,
} from "@/lib/email/preference-tokens"
import { env } from "@/lib/env"

const ROOT = process.cwd()
const originalEnv = {
  RESEND_API_KEY: env.RESEND_API_KEY,
  RESEND_AUTH_EMAIL_API_KEY: env.RESEND_AUTH_EMAIL_API_KEY,
  RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
  RESEND_FROM_NAME: env.RESEND_FROM_NAME,
  RESEND_WEBHOOK_SECRET: env.RESEND_WEBHOOK_SECRET,
  EMAIL_OPS_TOKEN_SECRET: env.EMAIL_OPS_TOKEN_SECRET,
}

describe("email ops feature contract", () => {
  afterEach(() => {
    env.RESEND_API_KEY = originalEnv.RESEND_API_KEY
    env.RESEND_AUTH_EMAIL_API_KEY = originalEnv.RESEND_AUTH_EMAIL_API_KEY
    env.RESEND_FROM_EMAIL = originalEnv.RESEND_FROM_EMAIL
    env.RESEND_FROM_NAME = originalEnv.RESEND_FROM_NAME
    env.RESEND_WEBHOOK_SECRET = originalEnv.RESEND_WEBHOOK_SECRET
    env.EMAIL_OPS_TOKEN_SECRET = originalEnv.EMAIL_OPS_TOKEN_SECRET
  })

  it("builds a draft-first dashboard model with safe bulk delivery locked", () => {
    env.RESEND_API_KEY = undefined
    env.RESEND_AUTH_EMAIL_API_KEY = undefined
    env.RESEND_FROM_NAME = undefined
    env.RESEND_FROM_EMAIL = undefined
    env.RESEND_WEBHOOK_SECRET = undefined
    env.EMAIL_OPS_TOKEN_SECRET = undefined
    const input = buildEmailOpsDashboardInput()

    expect(input.id).toBe("email-ops")
    expect(input.campaigns).toHaveLength(3)
    expect(input.selectedCampaignId).toBe("weekly-product-update")
    expect(input.senderProfiles).toEqual([])
    expect(input.providerStatus).toMatchObject({
      provider: "resend",
      configured: false,
      webhookConfigured: false,
      bulkSendEnabled: false,
    })
    expect(input.safetyChecks.map((check) => check.state)).toEqual([
      "blocked",
      "warning",
      "warning",
      "blocked",
    ])
    const lockedMemberSegment = input.segments.find(
      (segment) => segment.id === "opted-in-members"
    )
    expect(lockedMemberSegment?.lockedReason).toContain("Bulk member sends")
  })

  it("reflects configured Resend sender and webhook safety state", () => {
    env.RESEND_API_KEY = "re_test"
    env.RESEND_FROM_NAME = "Coach House"
    env.RESEND_FROM_EMAIL = "updates@coachhouse.app"
    env.RESEND_WEBHOOK_SECRET = "whsec_test"
    env.EMAIL_OPS_TOKEN_SECRET = "email_ops_token_secret"

    expect(resolveEmailOpsProviderStatus()).toEqual({
      provider: "resend",
      configured: true,
      webhookConfigured: true,
      bulkSendEnabled: false,
      fromLabel: "Coach House <updates@coachhouse.app>",
    })
    expect(buildEmailOpsDashboardInput().senderProfiles).toEqual([
      {
        id: "configured-sender",
        name: "Coach House",
        email: "updates@coachhouse.app",
        avatarUrl: null,
      },
    ])
    expect(
      buildEmailOpsDashboardInput().safetyChecks.find(
        (check) => check.id === "unsubscribe-tokens"
      )
    ).toMatchObject({ state: "ready" })
  })

  it("normalizes test sends and renders markdown for provider delivery", () => {
    const normalized = normalizeEmailOpsTestSendInput({
      campaignId: " weekly-product-update ",
      to: " TEAM@CoachHouse.App ",
    })
    const campaign = findEmailOpsCampaign(normalized.campaignId)

    expect(normalized).toEqual({
      campaignId: "weekly-product-update",
      to: "team@coachhouse.app",
    })
    expect(campaign?.subject).toBe("What we are building next at Coach House")
    expect(renderEmailOpsMarkdownHtml("**Hello**")).toContain(
      "<strong>Hello</strong>"
    )
    expect(renderEmailOpsMarkdownText("# Hello\n\n**Team**")).toBe(
      "Hello\n\nTeam"
    )
  })

  it("seeds a public-facing product roadmap update with visual asset blocks", () => {
    const input = buildEmailOpsDashboardInput()
    const campaign = findEmailOpsCampaign("weekly-product-update")

    expect(input.selectedCampaignId).toBe("weekly-product-update")
    expect(campaign).toMatchObject({
      title: "Product roadmap update",
      audienceSegmentId: "opted-in-members",
      heroMetric: "Roadmap",
    })
    expect(campaign?.previewText).toContain(
      "workspace, fiscal sponsorship, documents, and opportunity intelligence"
    )

    const html = renderEmailOpsMarkdownHtml(campaign?.markdown ?? "")
    const text = renderEmailOpsMarkdownText(campaign?.markdown ?? "")

    expect(html).toContain("Coach House product update")
    expect(html).toContain("A clearer operating system for organizations")
    expect(html).toContain("Asset block / workspace canvas preview")
    expect(html).toContain("Asset block / fiscal sponsorship flow")
    expect(html).toContain("Asset block / opportunity intelligence preview")
    expect(html).toContain("Open your workspace")
    expect(text).toContain("Fiscal sponsorship that feels guided")
    expect(text).toContain("Where we are heading next")
    expect(html).not.toContain("check:structure")
    expect(html).not.toContain("dirty worktree")
    expect(html).not.toContain("browser visual")
    expect(html).not.toContain("not complete")
    expect(text).not.toContain("Need full end-to-end")
    expect(text).not.toContain("Security / QA / Repo Health")
  })

  it("creates signed unsubscribe tokens and rejects tampering", async () => {
    env.EMAIL_OPS_TOKEN_SECRET = "email_ops_token_secret"
    const token = await createEmailPreferenceToken({
      email: " TEAM@CoachHouse.App ",
      topicId: "product_updates",
      campaignId: "11111111-1111-4111-8111-111111111111",
      deliveryId: "22222222-2222-4222-8222-222222222222",
      expiresInSeconds: 60,
    })
    const verified = await verifyEmailPreferenceToken(token)

    expect(verified.ok).toBe(true)
    if (verified.ok) {
      expect(verified.payload.email).toBe("team@coachhouse.app")
      expect(verified.payload.topicId).toBe("product_updates")
      expect(verified.payload.campaignId).toBe(
        "11111111-1111-4111-8111-111111111111"
      )
    }

    await expect(
      verifyEmailPreferenceToken(`${token}tampered`)
    ).resolves.toEqual({
      ok: false,
      error: "Invalid unsubscribe token signature.",
    })
  })

  it("keeps the dashboard admin-only and separate from the draft editor", () => {
    const routeSource = readFileSync(
      join(ROOT, "src/app/(dashboard)/email/page.tsx"),
      "utf8"
    )
    const draftRouteSource = readFileSync(
      join(ROOT, "src/app/(dashboard)/email/drafts/[campaignId]/page.tsx"),
      "utf8"
    )
    const panelSource = readFileSync(
      join(ROOT, "src/features/email-ops/components/email-ops-panel.tsx"),
      "utf8"
    )
    const editorSource = readFileSync(
      join(
        ROOT,
        "src/features/email-ops/components/email-ops-draft-editor.tsx"
      ),
      "utf8"
    )
    const mailyEditorSource = readFileSync(
      join(
        ROOT,
        "src/features/email-ops/components/email-ops-maily-editor.tsx"
      ),
      "utf8"
    )
    const globalsSource = readFileSync(
      join(ROOT, "src/app/globals.css"),
      "utf8"
    )
    const packageSource = readFileSync(join(ROOT, "package.json"), "utf8")
    const orgMediaRouteSource = readFileSync(
      join(ROOT, "src/app/api/account/org-media/route.ts"),
      "utf8"
    )
    const unsubscribePageSource = readFileSync(
      join(ROOT, "src/app/(public)/unsubscribe/page.tsx"),
      "utf8"
    )
    const unsubscribeCardSource = readFileSync(
      join(
        ROOT,
        "src/features/email-ops/components/email-unsubscribe-card.tsx"
      ),
      "utf8"
    )
    const unsubscribeRouteSource = readFileSync(
      join(ROOT, "src/app/api/email/unsubscribe/route.ts"),
      "utf8"
    )
    expect(routeSource).toContain("await requireAdmin()")
    expect(routeSource).toContain("<EmailOpsPanel")
    expect(draftRouteSource).toContain("await requireAdmin()")
    expect(draftRouteSource).toContain("<EmailOpsDraftEditor")
    expect(draftRouteSource).toContain("initialBodyHtml")
    expect(panelSource).toContain("EmailOpsAnalyticsPanel")
    expect(panelSource).toContain("Open draft")
    expect(panelSource).toContain("/email/drafts/new")
    expect(panelSource).not.toContain("@/components/ui/badge")
    expect(panelSource).not.toContain("Weekly email ops")
    expect(panelSource).not.toContain("Textarea")
    expect(editorSource).toContain("EmailOpsMailyEditor")
    expect(editorSource).toContain("SenderProfileSelect")
    expect(editorSource).toContain("SenderProfileAvatar")
    expect(editorSource).toContain("No verified sender")
    expect(editorSource).toContain("Set RESEND_FROM_EMAIL")
    expect(editorSource).toContain("Title")
    expect(editorSource).toContain("Subject")
    expect(editorSource).toContain("Preview text")
    expect(editorSource).toContain('name="title"')
    expect(editorSource).toContain("onTitleChange")
    expect(editorSource).toContain("selectedSenderProfileId")
    expect(editorSource).toContain("Visual")
    expect(editorSource).toContain("HTML")
    expect(editorSource).toContain("uploadEmailDraftImage")
    expect(editorSource).toContain("/api/account/org-media?kind=email")
    expect(editorSource).toContain("onImageUpload={uploadEmailDraftImage}")
    expect(editorSource).toContain("Textarea")
    expect(editorSource).toContain("Send test")
    expect(editorSource).toContain("Save draft")
    expect(editorSource).toContain("disabled")
    expect(editorSource).not.toContain("Send campaign")
    expect(mailyEditorSource).toContain("@maily-to/core")
    expect(mailyEditorSource).toContain("@maily-to/core/blocks")
    expect(mailyEditorSource).toContain("ImageUploadExtension")
    expect(mailyEditorSource).toContain("hideContextMenu: false")
    expect(mailyEditorSource).toContain("hasMenuBar: true")
    expect(mailyEditorSource).toContain("EMAIL_OPS_MAILY_BLOCKS")
    expect(mailyEditorSource).toContain("button")
    expect(mailyEditorSource).toContain("columns")
    expect(mailyEditorSource).toContain("htmlCodeBlock")
    expect(globalsSource).toContain("@maily-to/core/style.css")
    expect(globalsSource).toContain("email-ops-maily-editor")
    expect(packageSource).toContain('"@maily-to/core"')
    expect(orgMediaRouteSource).toContain('kindParam === "email"')
    expect(unsubscribePageSource).toContain("verifyEmailPreferenceToken")
    expect(unsubscribePageSource).toContain("<EmailUnsubscribeCard")
    expect(unsubscribeCardSource).toContain("Unsubscribe from all marketing")
    expect(unsubscribeCardSource).toContain("/api/email/unsubscribe")
    expect(unsubscribeRouteSource).toContain("applyEmailUnsubscribeToken")
    expect(unsubscribeRouteSource).toContain("List-Unsubscribe")
    expect(unsubscribeRouteSource).toContain("one_click_header")
    expect(unsubscribeRouteSource).toContain("preference_page")
  })

  it("adds Resend webhook verification and admin-only email ops tables", () => {
    const routeSource = readFileSync(
      join(ROOT, "src/app/api/webhooks/resend/route.ts"),
      "utf8"
    )
    const migrationSource = readFileSync(
      join(
        ROOT,
        "supabase/migrations/20260608143000_add_platform_email_ops.sql"
      ),
      "utf8"
    )
    const consentMigrationSource = readFileSync(
      join(
        ROOT,
        "supabase/migrations/20260609103000_add_platform_email_consent_tracking.sql"
      ),
      "utf8"
    )
    const schemaSource = readFileSync(
      join(ROOT, "src/lib/supabase/schema/tables/index.ts"),
      "utf8"
    )
    const consentSource = readFileSync(
      join(ROOT, "src/lib/email/consent.ts"),
      "utf8"
    )
    const preferenceTokenSource = readFileSync(
      join(ROOT, "src/lib/email/preference-tokens.ts"),
      "utf8"
    )
    const auditSource = readFileSync(
      join(ROOT, "src/lib/email/content-audit.ts"),
      "utf8"
    )

    expect(routeSource).toContain("await request.text()")
    expect(routeSource).toContain("svix-id")
    expect(routeSource).toContain("svix-timestamp")
    expect(routeSource).toContain("svix-signature")
    expect(routeSource).toContain("resend.webhooks.verify")
    expect(routeSource).toContain("platform_email_events")
    expect(routeSource).toContain("platform_email_suppressions")
    expect(routeSource).toContain("platform_email_consent_events")
    expect(migrationSource).toContain(
      "create table if not exists public.platform_email_campaigns"
    )
    expect(migrationSource).toContain("idempotency_key text not null unique")
    expect(migrationSource).toContain(
      "alter table public.platform_email_campaigns enable row level security"
    )
    expect(migrationSource).toContain("using (public.is_admin())")
    expect(consentMigrationSource).toContain(
      "create table if not exists public.platform_email_topics"
    )
    expect(consentMigrationSource).toContain(
      "create table if not exists public.platform_email_preferences"
    )
    expect(consentMigrationSource).toContain(
      "create table if not exists public.platform_email_consent_events"
    )
    expect(consentMigrationSource).toContain(
      "create table if not exists public.platform_email_links"
    )
    expect(consentMigrationSource).toContain(
      "create table if not exists public.platform_email_link_clicks"
    )
    expect(consentMigrationSource).toContain(
      "alter table public.platform_email_preferences enable row level security"
    )
    expect(consentMigrationSource).toContain("using (public.is_admin())")
    expect(schemaSource).toContain(
      "platform_email_campaigns: PlatformEmailCampaignsTable"
    )
    expect(schemaSource).toContain(
      "platform_email_suppressions: PlatformEmailSuppressionsTable"
    )
    expect(schemaSource).toContain(
      "platform_email_topics: PlatformEmailTopicsTable"
    )
    expect(schemaSource).toContain(
      "platform_email_preferences: PlatformEmailPreferencesTable"
    )
    expect(schemaSource).toContain(
      "platform_email_consent_events: PlatformEmailConsentEventsTable"
    )
    expect(schemaSource).toContain(
      "platform_email_links: PlatformEmailLinksTable"
    )
    expect(schemaSource).toContain(
      "platform_email_link_clicks: PlatformEmailLinkClicksTable"
    )
    expect(preferenceTokenSource).toContain("createEmailPreferenceToken")
    expect(preferenceTokenSource).toContain("verifyEmailPreferenceToken")
    expect(preferenceTokenSource).toContain("crypto.subtle")
    expect(consentSource).toContain("applyEmailUnsubscribeToken")
    expect(auditSource).toContain("auditEmailContentForDelivery")
    expect(auditSource).toContain("dangerous-html")
    expect(auditSource).toContain("missing-unsubscribe")
  })
})
