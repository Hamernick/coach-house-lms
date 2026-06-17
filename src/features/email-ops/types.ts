export type EmailOpsCampaignStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "sent"
  | "paused"

export type EmailOpsSafetyState = "ready" | "warning" | "blocked"

export type EmailOpsCampaign = {
  id: string
  title: string
  subject: string
  previewText: string
  markdown: string
  status: EmailOpsCampaignStatus
  audienceSegmentId: string
  ownerName: string
  updatedAtLabel: string
  scheduledForLabel: string | null
  heroMetric: string
  heroLabel: string
  tags: string[]
}

export type EmailOpsRecipientSegment = {
  id: string
  label: string
  description: string
  count: number
  lockedReason?: string | null
}

export type EmailOpsSafetyCheck = {
  id: string
  label: string
  description: string
  state: EmailOpsSafetyState
}

export type EmailOpsProviderStatus = {
  provider: "resend"
  configured: boolean
  webhookConfigured: boolean
  bulkSendEnabled: boolean
  fromLabel: string
}

export type EmailOpsSenderProfile = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export type EmailOpsMetricPoint = {
  label: string
  sent: number
  opens: number
  clicks: number
}

export type EmailOpsSummaryMetric = {
  label: string
  value: string
  delta: string
}

export type EmailOpsHeatmapPoint = {
  id: string
  dayLabel: string
  hourLabel: string
  value: number
}

export type EmailOpsDashboardInput = {
  id: string
  selectedCampaignId: string
  campaigns: EmailOpsCampaign[]
  segments: EmailOpsRecipientSegment[]
  senderProfiles: EmailOpsSenderProfile[]
  safetyChecks: EmailOpsSafetyCheck[]
  providerStatus: EmailOpsProviderStatus
  summaryMetrics: EmailOpsSummaryMetric[]
  metricTrend: EmailOpsMetricPoint[]
  heatmap: EmailOpsHeatmapPoint[]
}

export type EmailOpsTestSendInput = {
  campaignId: string
  to: string
}

export type EmailOpsActionResult =
  | { ok: true; message: string; providerId?: string | null }
  | { ok: false; message: string }

export type EmailOpsTestSendAction = (
  formData: FormData
) => Promise<EmailOpsActionResult>
