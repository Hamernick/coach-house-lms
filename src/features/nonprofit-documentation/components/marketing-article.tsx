import { MARKETING_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { MarketingPlanBuilder } from "./marketing/marketing-plan-builder"

export function MarketingArticlePage() {
  return (
    <BestPracticeArticlePage
      article={MARKETING_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive planning tool"
          title="Build a source-backed 90-day communications rhythm"
          description="Define one audience, message, proof point, invitation, and maintainable channel cadence. Then export the brief or copy a guarded AI handoff for human-reviewed drafting."
        >
          <MarketingPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
