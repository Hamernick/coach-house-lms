import type { Metadata } from "next"

import {
  SUSTAINABILITY_ARTICLE,
  SustainabilityArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit sustainability guide and scenario planner",
  description: SUSTAINABILITY_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/sustainability",
  },
  openGraph: {
    title: SUSTAINABILITY_ARTICLE.title,
    description: SUSTAINABILITY_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/sustainability",
  },
}

export default function SustainabilityDocumentationPage() {
  return <SustainabilityArticlePage />
}
