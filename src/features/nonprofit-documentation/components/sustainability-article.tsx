import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { SUSTAINABILITY_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { SustainabilityPlanBuilder } from "./sustainability/sustainability-plan-builder"

export function SustainabilityArticlePage() {
  return (
    <BestPracticeArticlePage
      article={SUSTAINABILITY_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive sustainability scenario planner"
          {...DOCUMENTATION_TOOL_METADATA["best-practices/sustainability"]}
        >
          <SustainabilityPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
