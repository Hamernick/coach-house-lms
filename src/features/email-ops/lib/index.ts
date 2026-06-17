import { canSendResendEmail } from "@/lib/email/resend"
import { canCreateEmailPreferenceTokens } from "@/lib/email/preference-tokens"
import { env } from "@/lib/env"
import { markdownToHtmlLite } from "@/lib/markdown/simple"

import type {
  EmailOpsCampaign,
  EmailOpsDashboardInput,
  EmailOpsHeatmapPoint,
  EmailOpsProviderStatus,
  EmailOpsSafetyCheck,
  EmailOpsSenderProfile,
  EmailOpsTestSendInput,
} from "../types"

const EMAIL_OPS_HTML_DRAFT_MARKER = "<!-- email-ops-html-draft -->"

const EMAIL_OPS_PRODUCT_UPDATE_HTML = `${EMAIL_OPS_HTML_DRAFT_MARKER}
<div style="margin:0 auto;max-width:640px;background:#ffffff;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="padding:40px 32px 28px;border-bottom:1px solid #e8e8e8;">
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;letter-spacing:.02em;text-transform:uppercase;">Coach House product update</p>
    <h1 style="margin:0;color:#111111;font-size:36px;line-height:1.05;letter-spacing:-.03em;">A clearer operating system for organizations</h1>
    <p style="margin:18px 0 0;color:#444444;font-size:16px;line-height:1.65;">We are shaping Coach House around one simple idea: your organization should have one calm place to understand what is happening, what needs attention, and what support is available next.</p>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #e8e8e8;">
    <div style="border:1px dashed #c9c9c9;border-radius:24px;background:#f7f7f7;padding:28px;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Asset block / workspace canvas preview</p>
      <p style="margin:10px 0 0;color:#111111;font-size:15px;font-weight:600;">Add photo, SVG, or short animation showing organization cards connected on the canvas.</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">Suggested motion: cards settle into place, then a person node and document node connect to the organization.</p>
    </div>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #e8e8e8;">
    <h2 style="margin:0;color:#111111;font-size:20px;letter-spacing:-.02em;">What is coming into focus</h2>
    <div style="margin-top:18px;display:block;">
      <div style="padding:18px 0;border-top:1px solid #eeeeee;">
        <p style="margin:0;color:#111111;font-size:15px;font-weight:700;">Fiscal sponsorship that feels guided</p>
        <p style="margin:8px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">The flow is moving toward a real application, coach review, agreement, signature, and document-storage experience. The goal is less back-and-forth and a clearer path from interest to signed sponsorship.</p>
      </div>
      <div style="padding:18px 0;border-top:1px solid #eeeeee;">
        <p style="margin:0;color:#111111;font-size:15px;font-weight:700;">A workspace that shows relationships</p>
        <p style="margin:8px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">The canvas is becoming a visual map of your organization: people, programs, documents, roadmap items, and coaching support in context rather than scattered across separate pages.</p>
      </div>
      <div style="padding:18px 0;border-top:1px solid #eeeeee;">
        <p style="margin:0;color:#111111;font-size:15px;font-weight:700;">Documents that become reusable knowledge</p>
        <p style="margin:8px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">Organization overviews, signed agreements, handbooks, uploads, and working notes are being treated as useful context that can be found, reviewed, downloaded, and used to move work forward.</p>
      </div>
    </div>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #e8e8e8;">
    <div style="border:1px dashed #c9c9c9;border-radius:24px;background:#f7f7f7;padding:28px;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Asset block / fiscal sponsorship flow</p>
      <p style="margin:10px 0 0;color:#111111;font-size:15px;font-weight:600;">Add a minimal sequence illustration: Application -> Review -> Agreement -> Signatures -> Stored documents.</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">Suggested format: thin-line SVG or three-frame animation with the current product UI as the reference.</p>
    </div>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #e8e8e8;">
    <h2 style="margin:0;color:#111111;font-size:20px;letter-spacing:-.02em;">Where we are heading next</h2>
    <p style="margin:12px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">The next layer is opportunity intelligence: helping organizations surface relevant grants, funding opportunities, events, social signals, and next-step recommendations based on the information they choose to keep in Coach House.</p>
    <p style="margin:14px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">We are also preparing usage credits so AI-powered work can be understandable, trackable, and controlled. The product direction is simple: useful automation, clear limits, and human review where it matters.</p>
  </div>

  <div style="padding:28px 32px;border-bottom:1px solid #e8e8e8;">
    <div style="border:1px dashed #c9c9c9;border-radius:24px;background:#f7f7f7;padding:28px;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:12px;letter-spacing:.04em;text-transform:uppercase;">Asset block / opportunity intelligence preview</p>
      <p style="margin:10px 0 0;color:#111111;font-size:15px;font-weight:600;">Add product still or animation showing opportunities flowing into an activity monitor.</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">Suggested callouts: "Review fit," "Draft materials," "Ask a coach," and "Save to documents."</p>
    </div>
  </div>

  <div style="padding:28px 32px 40px;">
    <h2 style="margin:0;color:#111111;font-size:20px;letter-spacing:-.02em;">How to read the roadmap</h2>
    <p style="margin:12px 0 0;color:#4b5563;font-size:14px;line-height:1.65;">We are building toward a workspace where strategy, compliance, documents, coaching, and opportunities reinforce each other. Each update will show the product direction in plain language and preview the parts of the system as they become easier to use.</p>
    <p style="margin:22px 0 0;">
      <a href="https://coachhouse.app/my-organization" style="display:inline-block;border-radius:999px;background:#111111;color:#ffffff;font-size:14px;font-weight:700;line-height:1;padding:13px 18px;text-decoration:none;">Open your workspace</a>
    </p>
  </div>
</div>`

const EMAIL_OPS_CAMPAIGNS: EmailOpsCampaign[] = [
  {
    id: "weekly-product-update",
    title: "Product roadmap update",
    subject: "What we are building next at Coach House",
    previewText:
      "A simple look at the workspace, fiscal sponsorship, documents, and opportunity intelligence roadmap.",
    markdown: EMAIL_OPS_PRODUCT_UPDATE_HTML,
    status: "draft",
    audienceSegmentId: "opted-in-members",
    ownerName: "Coach House",
    updatedAtLabel: "Today",
    scheduledForLabel: "Friday 9:00 AM",
    heroMetric: "Roadmap",
    heroLabel: "public product update draft",
    tags: ["product", "roadmap", "members"],
  },
  {
    id: "coach-welcome",
    title: "Coach welcome",
    subject: "Welcome to Coach House",
    previewText:
      "First internal welcome note for new coaches and collaborators.",
    markdown:
      "# Coach welcome\n\nWelcome to the weekly Coach House product update. This draft will become the lightweight launch path for onboarding coaches into the workspace.",
    status: "review",
    audienceSegmentId: "coaches",
    ownerName: "Coach House",
    updatedAtLabel: "Yesterday",
    scheduledForLabel: null,
    heroMetric: "18",
    heroLabel: "coach recipients",
    tags: ["coaches", "welcome"],
  },
  {
    id: "member-roundup",
    title: "Member roundup",
    subject: "Member workspace roundup",
    previewText: "A safer template for member-facing product notes.",
    markdown:
      "# Member roundup\n\nA short member-facing update belongs here once consent, audience segmentation, and suppression checks are fully wired.",
    status: "paused",
    audienceSegmentId: "opted-in-members",
    ownerName: "Coach House",
    updatedAtLabel: "May 31",
    scheduledForLabel: null,
    heroMetric: "0",
    heroLabel: "bulk sends enabled",
    tags: ["members", "paused"],
  },
]

export function resolveEmailOpsProviderStatus(): EmailOpsProviderStatus {
  const fromEmail = env.RESEND_FROM_EMAIL?.trim()
  const fromName = env.RESEND_FROM_NAME?.trim() || "Coach House"

  return {
    provider: "resend",
    configured: canSendResendEmail(),
    webhookConfigured: Boolean(env.RESEND_WEBHOOK_SECRET?.trim()),
    bulkSendEnabled: false,
    fromLabel: fromEmail
      ? `${fromName} <${fromEmail}>`
      : "No sender configured",
  }
}

export function buildEmailOpsSafetyChecks(
  providerStatus: EmailOpsProviderStatus
): EmailOpsSafetyCheck[] {
  return [
    {
      id: "resend-provider",
      label: "Resend provider",
      description: providerStatus.configured
        ? "API key is available for test delivery."
        : "Set RESEND_API_KEY before sending test emails.",
      state: providerStatus.configured ? "ready" : "blocked",
    },
    {
      id: "webhook-events",
      label: "Webhook events",
      description: providerStatus.webhookConfigured
        ? "Webhook secret is configured for event ingestion."
        : "Add RESEND_WEBHOOK_SECRET before relying on delivery analytics.",
      state: providerStatus.webhookConfigured ? "ready" : "warning",
    },
    {
      id: "bulk-send",
      label: "Bulk send lock",
      description:
        "Bulk sends stay disabled until suppression and approval workflows are live.",
      state: providerStatus.bulkSendEnabled ? "ready" : "warning",
    },
    {
      id: "unsubscribe-tokens",
      label: "Unsubscribe tokens",
      description: canCreateEmailPreferenceTokens()
        ? "Signed unsubscribe links can be generated for outbound email."
        : "Set EMAIL_OPS_TOKEN_SECRET before sending marketing email.",
      state: canCreateEmailPreferenceTokens() ? "ready" : "blocked",
    },
  ]
}

function parseResendFromLabel(fromLabel: string) {
  const match = fromLabel.match(/^(.*?)\s*<([^>]+)>$/)
  if (!match) {
    return {
      name: "Coach House",
      email: fromLabel.trim(),
    }
  }

  return {
    name: match[1]?.trim() || "Coach House",
    email: match[2]?.trim() || "",
  }
}

export function buildEmailOpsSenderProfiles(
  providerStatus: EmailOpsProviderStatus
): EmailOpsSenderProfile[] {
  const configuredEmail = env.RESEND_FROM_EMAIL?.trim()
  if (!configuredEmail) return []
  const configuredSender = parseResendFromLabel(providerStatus.fromLabel)

  const senderProfiles: EmailOpsSenderProfile[] = [
    {
      id: "configured-sender",
      name: env.RESEND_FROM_NAME?.trim() || configuredSender.name,
      email: configuredEmail,
      avatarUrl: null,
    },
  ]
  const seenEmails = new Set<string>()

  return senderProfiles.filter((profile) => {
    const normalizedEmail = profile.email.trim().toLowerCase()
    if (seenEmails.has(normalizedEmail)) return false
    seenEmails.add(normalizedEmail)
    return true
  })
}

export function buildEmailOpsHeatmap(): EmailOpsHeatmapPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  const hours = ["8a", "10a", "12p", "2p", "4p", "6p"]

  return days.flatMap((dayLabel, dayIndex) =>
    hours.map((hourLabel, hourIndex) => {
      const focusScore = Math.max(
        0,
        92 - Math.abs(dayIndex - 3) * 14 - Math.abs(hourIndex - 2) * 10
      )

      return {
        id: `${dayLabel}-${hourLabel}`,
        dayLabel,
        hourLabel,
        value: focusScore,
      }
    })
  )
}

export function buildEmailOpsDashboardInput(): EmailOpsDashboardInput {
  const providerStatus = resolveEmailOpsProviderStatus()

  return {
    id: "email-ops",
    selectedCampaignId: EMAIL_OPS_CAMPAIGNS[0].id,
    campaigns: EMAIL_OPS_CAMPAIGNS,
    segments: [
      {
        id: "internal-team",
        label: "Internal team",
        description: "Admins, coaches, and operators",
        count: 12,
      },
      {
        id: "coaches",
        label: "Coaches",
        description: "Coach-specific product notes",
        count: 18,
      },
      {
        id: "opted-in-members",
        label: "Opted-in members",
        description: "Members with newsletter or marketing consent",
        count: 148,
        lockedReason: "Bulk member sends are locked in v1.",
      },
    ],
    senderProfiles: buildEmailOpsSenderProfiles(providerStatus),
    safetyChecks: buildEmailOpsSafetyChecks(providerStatus),
    providerStatus,
    summaryMetrics: [
      { label: "Delivered", value: "2,418", delta: "+12% WoW" },
      { label: "Open rate", value: "64%", delta: "+6% WoW" },
      { label: "Click rate", value: "18%", delta: "+3% WoW" },
      { label: "Unsubscribes", value: "0.3%", delta: "-0.1% WoW" },
    ],
    metricTrend: [
      { label: "Week 1", sent: 420, opens: 238, clicks: 54 },
      { label: "Week 2", sent: 520, opens: 315, clicks: 82 },
      { label: "Week 3", sent: 610, opens: 392, clicks: 109 },
      { label: "Week 4", sent: 868, opens: 556, clicks: 156 },
    ],
    heatmap: buildEmailOpsHeatmap(),
  }
}

export function normalizeEmailOpsTestSendInput(
  input: EmailOpsTestSendInput
): EmailOpsTestSendInput {
  return {
    campaignId: input.campaignId.trim(),
    to: input.to.trim().toLowerCase(),
  }
}

export function findEmailOpsCampaign(campaignId: string) {
  return (
    EMAIL_OPS_CAMPAIGNS.find((campaign) => campaign.id === campaignId) ?? null
  )
}

export function buildEmailOpsNewDraftCampaign(): EmailOpsCampaign {
  return {
    id: "new",
    title: "Untitled email",
    subject: "Draft subject",
    previewText: "A new weekly update draft.",
    markdown: "# Untitled email\n\nHi team,\n\n",
    status: "draft",
    audienceSegmentId: "internal-team",
    ownerName: "Coach House",
    updatedAtLabel: "Unsaved",
    scheduledForLabel: null,
    heroMetric: "Draft",
    heroLabel: "not scheduled",
    tags: [],
  }
}

export function resolveEmailOpsDraftCampaign(campaignId: string) {
  if (campaignId === "new") return buildEmailOpsNewDraftCampaign()
  return findEmailOpsCampaign(campaignId)
}

export function renderEmailOpsMarkdownHtml(markdown: string) {
  const trimmed = markdown.trim()
  if (trimmed.startsWith(EMAIL_OPS_HTML_DRAFT_MARKER)) {
    return trimmed.replace(EMAIL_OPS_HTML_DRAFT_MARKER, "").trim()
  }

  return markdownToHtmlLite(markdown)
}

export function renderEmailOpsMarkdownText(markdown: string) {
  const trimmed = markdown.trim()
  if (trimmed.startsWith(EMAIL_OPS_HTML_DRAFT_MARKER)) {
    return trimmed
      .replace(EMAIL_OPS_HTML_DRAFT_MARKER, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  }

  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^- /gm, "- ")
    .trim()
}
