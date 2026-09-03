import { CRM_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { CrmPlanBuilder } from "./crm/crm-plan-builder"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"

export function CrmArticlePage() {
  return (
    <BestPracticeArticlePage
      article={CRM_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive CRM planning tool"
          title="Define a responsible relationship record"
          description="Connect one system purpose to accountable practices and a generic field dictionary. The draft stays on this device, connects to nothing, and should contain no real constituent information."
        >
          <CrmPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
