import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["tools/hr"]}
        >
          <HrPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
