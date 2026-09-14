import type { Metadata } from "next"

import {
  COMPLIANCE_ARTICLE,
  ComplianceArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit compliance guide and annual planning tool",
  description: COMPLIANCE_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/compliance",
  },
  openGraph: {
    title: COMPLIANCE_ARTICLE.title,
    description: COMPLIANCE_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/compliance",
  },
}

export default function ComplianceDocumentationPage() {
  return <ComplianceArticlePage />
}
