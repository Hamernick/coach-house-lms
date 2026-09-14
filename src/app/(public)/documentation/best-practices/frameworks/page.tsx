import type { Metadata } from "next"

import {
  FRAMEWORKS_ARTICLE,
  FrameworksArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit frameworks guide and logic-model workspace",
  description: FRAMEWORKS_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/frameworks",
  },
  openGraph: {
    title: FRAMEWORKS_ARTICLE.title,
    description: FRAMEWORKS_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/frameworks",
  },
}

export default function FrameworksDocumentationPage() {
  return <FrameworksArticlePage />
}
