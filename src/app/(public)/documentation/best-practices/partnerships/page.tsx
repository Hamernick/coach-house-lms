import type { Metadata } from "next"

import {
  PARTNERSHIPS_ARTICLE,
  PartnershipsArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit partnerships guide and brief builder",
  description: PARTNERSHIPS_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/partnerships",
  },
  openGraph: {
    title: PARTNERSHIPS_ARTICLE.title,
    description: PARTNERSHIPS_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/partnerships",
  },
}

export default function PartnershipsDocumentationPage() {
  return <PartnershipsArticlePage />
}
