import type { Metadata } from "next"

import {
  MARKETING_ARTICLE,
  MarketingArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit marketing guide and 90-day planning tool",
  description: MARKETING_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/marketing",
  },
  openGraph: {
    title: MARKETING_ARTICLE.title,
    description: MARKETING_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/marketing",
  },
}

export default function MarketingDocumentationPage() {
  return <MarketingArticlePage />
}
