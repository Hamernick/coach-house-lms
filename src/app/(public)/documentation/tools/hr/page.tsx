import type { Metadata } from "next"

import { HR_ARTICLE, HrArticlePage } from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit HR guide and role-planning tool",
  description: HR_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/hr" },
  openGraph: {
    title: HR_ARTICLE.title,
    description: HR_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/hr",
  },
}

export default function HrDocumentationPage() {
  return <HrArticlePage />
}
