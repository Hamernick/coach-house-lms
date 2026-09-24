import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { FINANCE_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { FinancePlanBuilder } from "./finance/finance-plan-builder"

export function FinanceArticlePage() {
  return (
    <BestPracticeArticlePage
      article={FINANCE_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive finance tool"
          {...DOCUMENTATION_TOOL_METADATA["tools/finance"]}
        >
          <FinancePlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
