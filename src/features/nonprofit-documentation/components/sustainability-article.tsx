import { SUSTAINABILITY_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { SustainabilityPlanBuilder } from "./sustainability/sustainability-plan-builder"

export function SustainabilityArticlePage() {
  return (
    <BestPracticeArticlePage
      article={SUSTAINABILITY_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive sustainability scenario planner"
          title="Test mission commitments against money, people, and continuity"
          description="Build a transparent planning scenario, keep restricted resources separate, expose capacity and continuity risks, then export the work or copy a guarded review prompt."
        >
          <SustainabilityPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
