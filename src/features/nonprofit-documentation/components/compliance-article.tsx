import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { COMPLIANCE_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { ComplianceRhythmBuilder } from "./compliance/compliance-rhythm-builder"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"

export function ComplianceArticlePage() {
  return (
    <BestPracticeArticlePage
      article={COMPLIANCE_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive planning tool"
          {...DOCUMENTATION_TOOL_METADATA["best-practices/compliance"]}
        >
          <ComplianceRhythmBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
