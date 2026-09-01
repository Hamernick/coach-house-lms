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
