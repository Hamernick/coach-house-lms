import type { Metadata } from "next"

import {
  LEGAL_ARTICLE,
  LegalArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit legal guide and referral-brief tool",
  description: LEGAL_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/legal" },
  openGraph: {
    title: LEGAL_ARTICLE.title,
    description: LEGAL_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/legal",
  },
}

export default function LegalDocumentationPage() {
  return <LegalArticlePage />
}
