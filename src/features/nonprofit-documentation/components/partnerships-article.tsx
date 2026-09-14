import { PARTNERSHIPS_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { PartnershipBriefBuilder } from "./partnerships/partnership-brief-builder"

export function PartnershipsArticlePage() {
  return (
    <BestPracticeArticlePage
      article={PARTNERSHIPS_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive partnership brief builder"
          title="Put the shared purpose, each contribution, and decision rights on one table"
          description="Draft a bounded relationship, expose assumptions and safeguards, schedule reviews, then export the brief or copy a guarded review prompt. The result is preparation for a real agreement, not the agreement itself."
        >
          <PartnershipBriefBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
