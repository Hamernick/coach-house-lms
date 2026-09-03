import type { Metadata } from "next"

import {
  FINANCE_ARTICLE,
  FinanceArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit finance guide and operating-plan tool",
  description: FINANCE_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/finance" },
  openGraph: {
    title: FINANCE_ARTICLE.title,
    description: FINANCE_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/finance",
  },
}

export default function FinanceDocumentationPage() {
  return <FinanceArticlePage />
}
