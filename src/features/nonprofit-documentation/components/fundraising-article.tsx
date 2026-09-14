import { FUNDRAISING_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { FundraisingPlanBuilder } from "./fundraising/fundraising-plan-builder"

export function FundraisingArticlePage() {
  return (
    <BestPracticeArticlePage
      article={FUNDRAISING_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive planning tool"
          title="Build a transparent fundraising plan"
          description="Set the funding need, assign planning amounts to a small channel mix, and generate a stage-specific action plan. Every number remains an assumption until support is committed."
        >
          <FundraisingPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
