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
          title="Build a decision-ready nonprofit campaign brief"
          description="Connect one objective, audience, action, message, destination, delivery system, safeguards, and learning decision. The draft stays on this device and publishes nothing."
        >
          <CampaignPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
