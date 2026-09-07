import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["tools/networking"]}
        >
          <NetworkingPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
