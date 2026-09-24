import type { Metadata } from "next"

import { CRM_ARTICLE, CrmArticlePage } from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit CRM guide and data-stewardship field planner",
  description: CRM_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/crm" },
  openGraph: {
    title: CRM_ARTICLE.title,
    description: CRM_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/crm",
  },
}

export default function CrmDocumentationPage() {
  return <CrmArticlePage />
}
