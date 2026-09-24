import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["best-practices/partnerships"]}
        >
          <PartnershipBriefBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
