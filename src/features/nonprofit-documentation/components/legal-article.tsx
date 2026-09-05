import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { LEGAL_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { LegalPlanBuilder } from "./legal/legal-plan-builder"

export function LegalArticlePage() {
  return (
    <BestPracticeArticlePage
      article={LEGAL_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive legal planning tool"
          {...DOCUMENTATION_TOOL_METADATA["tools/legal"]}
        >
          <LegalPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
