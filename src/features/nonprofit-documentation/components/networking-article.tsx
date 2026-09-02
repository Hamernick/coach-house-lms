import { NETWORKING_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { NetworkingPlanBuilder } from "./networking/networking-plan-builder"

export function NetworkingArticlePage() {
  return (
    <BestPracticeArticlePage
      article={NETWORKING_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive relationship tool"
          title="Map a reciprocal nonprofit relationship system"
          description="Define the purpose, community accountability, relationship roles, reciprocal value, accessible invitation, follow-through, safeguards, and human review. The draft stays on this device and contacts no one."
        >
          <NetworkingPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
