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
          title="Build a reviewable operating-finance rhythm"
          description="Keep restricted and unrestricted resources separate, connect cash planning to operating controls, and prepare better questions for staff, the board, and qualified reviewers. The draft stays on this device and moves no money."
        >
          <FinancePlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
