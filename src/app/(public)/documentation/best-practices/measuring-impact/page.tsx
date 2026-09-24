import type { Metadata } from "next"

import {
  MEASURING_IMPACT_ARTICLE,
  MeasuringImpactArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit impact measurement guide and planning tool",
  description: MEASURING_IMPACT_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/measuring-impact",
  },
  openGraph: {
    title: MEASURING_IMPACT_ARTICLE.title,
    description: MEASURING_IMPACT_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/measuring-impact",
  },
}

export default function MeasuringImpactDocumentationPage() {
  return <MeasuringImpactArticlePage />
}
