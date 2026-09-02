import type { Metadata } from "next"

import {
  FUNDRAISING_ARTICLE,
  FundraisingArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit fundraising guide and planning tool",
  description: FUNDRAISING_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/fundraising",
  },
  openGraph: {
    title: FUNDRAISING_ARTICLE.title,
    description: FUNDRAISING_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/fundraising",
  },
}

export default function FundraisingDocumentationPage() {
  return <FundraisingArticlePage />
}
