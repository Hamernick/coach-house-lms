import { MEASURING_IMPACT_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { MeasurementPlanBuilder } from "./measuring-impact/measurement-plan-builder"

export function MeasuringImpactArticlePage() {
  return (
    <BestPracticeArticlePage
      article={MEASURING_IMPACT_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive measurement-plan builder"
          title="Connect one decision to an outcome, evidence, and action"
          description="Draft a live evidence chain, estimate respondent burden, expose missing safeguards and limitations, then export the plan or copy a guarded review prompt."
        >
          <MeasurementPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
