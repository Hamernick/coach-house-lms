import type { Metadata } from "next"

import {
  SOCIAL_MEDIA_ARTICLE,
  SocialMediaArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit social media guide and content planning tool",
  description: SOCIAL_MEDIA_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/social-media" },
  openGraph: {
    title: SOCIAL_MEDIA_ARTICLE.title,
    description: SOCIAL_MEDIA_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/social-media",
  },
}

export default function SocialMediaDocumentationPage() {
  return <SocialMediaArticlePage />
}
