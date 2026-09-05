import { DOCUMENTATION_TOOL_METADATA } from "../lib/documentation-tools"
import { SOCIAL_MEDIA_ARTICLE } from "../lib"
import { BestPracticeArticlePage } from "./best-practice-article"
import { DocumentationSandboxFrame } from "./documentation-sandbox-frame"
import { SocialMediaPlanBuilder } from "./social-media/social-media-plan-builder"

export function SocialMediaArticlePage() {
  return (
    <BestPracticeArticlePage
      article={SOCIAL_MEDIA_ARTICLE}
      interactive={
        <DocumentationSandboxFrame
          eyebrow="Interactive content tool"
          {...DOCUMENTATION_TOOL_METADATA["tools/social-media"]}
        >
          <SocialMediaPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
