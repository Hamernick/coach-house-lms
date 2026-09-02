import { FRAMEWORKS_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { FrameworkWorkspace } from "./frameworks/framework-workspace"

export function FrameworksArticlePage() {
  return (
    <BestPracticeArticlePage
      article={FRAMEWORKS_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive framework workspace"
          title="Choose a framework and build a reviewable program pathway"
          description="Start from the decision you need to support, draft a live logic model, expose assumptions and missing links, then export the work or copy a guarded review prompt."
        >
          <FrameworkWorkspace />
        </DocumentationSandboxFrame>
      }
    />
  )
}
