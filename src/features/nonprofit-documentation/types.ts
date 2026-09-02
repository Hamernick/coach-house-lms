export type DocumentationStageId =
  | "exploring"
  | "forming"
  | "operating"
  | "growing"

export type DocumentationNavStatus = "live" | "planned" | "design-pending"

export type DocumentationNavItem = {
  title: string
  description: string
  href?: string
  status: DocumentationNavStatus
  external?: boolean
}

export type DocumentationNavSection = {
  id: "get-started" | "best-practices" | "tools" | "resources"
  title: string
  items: DocumentationNavItem[]
}

export type DocumentationStageGuidance = {
  id: DocumentationStageId
  label: string
  question: string
  guidance: string
  actions: string[]
  checkpoint: string
}

export type DocumentationSource = {
  title: string
  publisher: string
  url: string
  note: string
}

export type FoundationGuide = {
  slug: "quickstart" | "key-concepts"
  title: string
  description: string
  eyebrow: string
  answer: string
  readingTime: string
  reviewedDate: string
  sections: Array<{
    id: string
    title: string
    introduction: string
    entries: Array<{
      title: string
      description: string
      detail?: string
    }>
  }>
  stages: DocumentationStageGuidance[]
  checklist: string[]
  sources: DocumentationSource[]
}

export type BestPracticeArticle = {
  slug: `best-practices/${string}`
  navigationTitle: string
  title: string
  description: string
  eyebrow: string
  answer: string
  readingTime: string
  reviewedDate: string
  publishedDate: string
  modifiedDate: string
  labels: {
    definition: string
    stages: string
    example: string
    framework: string
    checklist: string
    mistakes: string
    measures: string
  }
  definition: string
  whyItMatters: string[]
  importantNote: string
  stages: DocumentationStageGuidance[]
  example: {
    name: string
    context: string
    weakLabel: string
    weak: string
    strongLabel: string
    strong: string
    reason: string
  }
  framework: Array<{
    title: string
    instruction: string
    prompt: string
  }>
  checklist: string[]
  mistakes: Array<{ mistake: string; correction: string }>
  measuresIntroduction: string
  measures: string[]
  sources: DocumentationSource[]
  disclaimer: string
  previous?: { title: string; href: string }
  next?: { title: string; href?: string }
}

export type ComplianceReceiptsBand =
  | "normally-50k-or-less"
  | "under-200k"
  | "200k-or-more"

export type ComplianceAssetsBand = "under-500k" | "500k-or-more"

export type ComplianceRhythmDraft = {
  version: 1
  stateCode: string
  taxYearEnd: string
  receiptsBand: ComplianceReceiptsBand
  assetsBand: ComplianceAssetsBand
  solicitsContributions: boolean
  hasEmployees: boolean
}

export type ComplianceTask = {
  id: string
  category: "Federal" | "State" | "Governance" | "Records" | "Employment"
  status: "Common requirement" | "Conditional" | "Recommended practice"
  task: string
  timing: string
  evidence: string
}

export type FundraisingChannelId =
  | "individuals"
  | "foundations"
  | "government"
  | "corporate"
  | "events"

export type FundraisingChannelTargets = Record<FundraisingChannelId, number>

export type FundraisingPlanDraft = {
  version: 1
  organizationName: string
  stage: DocumentationStageId
  periodMonths: 3 | 6 | 12 | 18
  fundingGoal: number
  committedFunds: number
  channelTargets: FundraisingChannelTargets
  hasCaseForSupport: boolean
  hasGiftAcknowledgmentProcess: boolean
}

export type FundraisingPlanSummary = {
  fundingNeed: number
  plannedTotal: number
  remainingGap: number
  overplannedAmount: number
  monthlyPace: number
}

export type FundraisingPlanAction = {
  id: string
  phase: "Foundation" | "Relationships" | "Ask" | "Stewardship" | "Systems"
  action: string
  evidence: string
}

export type MarketingObjectiveId =
  | "service-access"
  | "community-awareness"
  | "event-participation"
  | "volunteer-recruitment"
  | "donor-engagement"
  | "partner-development"

export type MarketingChannelId =
  | "email"
  | "website"
  | "social"
  | "partners"
  | "events"
  | "media"

export type MarketingChannelCadence = Record<MarketingChannelId, number>

export type MarketingPlanDraft = {
  version: 1
  organizationName: string
  campaignName: string
  stage: DocumentationStageId
  objective: MarketingObjectiveId
  primaryAudience: string
  mainMessage: string
  proofPoint: string
  invitation: string
  channelCadence: MarketingChannelCadence
  hasStoryPermissionProcess: boolean
  hasContentReviewProcess: boolean
  hasLinkTrackingConvention: boolean
}

export type MarketingPlanSummary = {
  activeChannelCount: number
  monthlyOutputs: number
  ninetyDayOutputs: number
  weeklyPace: number
  hasCoreBrief: boolean
}

export type MarketingPlanAction = {
  id: string
  phase:
    | "Foundation"
    | "Audience"
    | "Content"
    | "Distribution"
    | "Governance"
    | "Measurement"
  action: string
  evidence: string
}

export type FrameworkQuestionId =
  | "understand-system"
  | "explain-change"
  | "plan-program"
  | "clarify-ownership"
  | "learn-and-adapt"

export type NonprofitFrameworkId =
  | "systems-map"
  | "theory-of-change"
  | "logic-model"
  | "responsibility-map"
  | "learning-cycle"

export type LogicModelDraft = {
  version: 1
  organizationName: string
  programName: string
  stage: DocumentationStageId
  primaryQuestion: FrameworkQuestionId
  need: string
  people: string
  inputs: string
  activities: string
  outputs: string
  nearTermOutcomes: string
  intermediateOutcomes: string
  longTermContribution: string
  assumptions: string
  context: string
  learningQuestion: string
}

export type LogicModelSummary = {
  draftedAreaCount: number
  totalAreaCount: number
  causalLinkCount: number
  hasCompletePathway: boolean
}

export type LogicModelAction = {
  id: string
  phase: "Context" | "Pathway" | "Evidence" | "Governance"
  action: string
  evidence: string
}

export type BrandIdentityColor = {
  id: "canvas" | "brand" | "utility" | "ink"
  role: "Background" | "Primary" | "Secondary" | "Text"
  name: string
  value: string
  proportion: number
}

export type BrandIdentityDraft = {
  version: 1
  organizationName: string
  tagline: string
  introduction: string
  purpose: string
  audience: string
  logoGuidance: string
  colors: BrandIdentityColor[]
  headingFont: string
  bodyFont: string
  baseSize: number
  typeRatio: number
  campaignHeadline: string
  campaignBody: string
  updatedAt: string
}

export type BrandAssetId =
  | "primary-logo"
  | "brand-mark"
  | "application-image"
  | `illustration-${1 | 2 | 3 | 4 | 5 | 6}`

export type StoredBrandAsset = {
  id: BrandAssetId
  name: string
  type: string
  blob: Blob
  updatedAt: string
}
