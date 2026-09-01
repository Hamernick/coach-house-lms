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
  id: "get-started" | "best-practices" | "toolbox" | "resources"
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

export type MissionArticle = {
  slug: "best-practices/mission"
  title: string
  description: string
  eyebrow: string
  answer: string
  readingTime: string
  reviewedDate: string
  definition: string
  whyItMatters: string[]
  stages: DocumentationStageGuidance[]
  example: {
    name: string
    context: string
    weak: string
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
  measures: string[]
  sources: DocumentationSource[]
}

export type BrandIdentityColor = {
  id: "canvas" | "brand" | "utility" | "ink"
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
