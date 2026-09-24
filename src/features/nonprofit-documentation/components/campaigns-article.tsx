import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { CAMPAIGNS_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { CampaignPlanBuilder } from "./campaigns/campaign-plan-builder"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"

export function CampaignsArticlePage() {
  return (
    <BestPracticeArticlePage
      article={CAMPAIGNS_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive campaign planning tool"
          {...DOCUMENTATION_TOOL_METADATA["tools/campaigns"]}
        >
          <CampaignPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
