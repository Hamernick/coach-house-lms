import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["tools/crm"]}
        >
          <CrmPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
