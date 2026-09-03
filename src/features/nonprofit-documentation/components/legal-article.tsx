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
          title="Prepare a responsible matter and referral brief"
          description="Separate facts from assumptions, protect people and evidence, map authority and jurisdiction, and prepare focused questions for qualified counsel. The draft stays on this device and provides no legal advice."
        >
          <LegalPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
