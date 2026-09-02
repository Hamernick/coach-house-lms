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
          title="Build a source-backed social media brief"
          description="Plan the audience, source, action, channel rhythm, accessible content, safeguards, response ownership, tracked link, and human review. The draft stays on this device and is never published."
        >
          <SocialMediaPlanBuilder />
        </DocumentationSandboxFrame>
      }
    />
  )
}
