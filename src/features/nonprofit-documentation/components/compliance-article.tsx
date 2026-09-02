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
          title="Build your annual compliance rhythm"
          description="Add a few operating facts to create a device-local review plan. The result identifies common federal filing paths and the questions that still require state or professional confirmation."
        >
          <ComplianceRhythmBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
