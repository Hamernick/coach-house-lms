import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
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
          {...DOCUMENTATION_TOOL_METADATA["best-practices/frameworks"]}
        >
          <FrameworkWorkspace />
        </DocumentationSandboxFrame>
      }
    />
  )
}
