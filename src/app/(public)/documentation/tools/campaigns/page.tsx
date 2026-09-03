import type { Metadata } from "next"

import {
  CAMPAIGNS_ARTICLE,
  CampaignsArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit campaigns guide and campaign brief builder",
  description: CAMPAIGNS_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/campaigns" },
  openGraph: {
    title: CAMPAIGNS_ARTICLE.title,
    description: CAMPAIGNS_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/campaigns",
  },
}

export default function CampaignsDocumentationPage() {
  return <CampaignsArticlePage />
}
