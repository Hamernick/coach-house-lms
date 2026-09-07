import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["best-practices/measuring-impact"]}
        >
          <MeasurementPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
