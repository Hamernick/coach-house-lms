import { HR_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { HrPlanBuilder } from "./hr/hr-plan-builder"

export function HrArticlePage() {
  return (
    <BestPracticeArticlePage
      article={HR_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive people-practices tool"
          title="Build a reviewable role lifecycle"
          description="Define necessary work, working relationship facts, full cost, fair recruitment, onboarding, support, records, safety, and transition. The draft stays on this device and makes no people decisions."
        >
          <HrPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
