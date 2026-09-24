import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["best-practices/fundraising"]}
        >
          <FundraisingPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
