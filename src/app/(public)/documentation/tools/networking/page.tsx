import type { Metadata } from "next"

import {
  NETWORKING_ARTICLE,
  NetworkingArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit networking guide and relationship-map tool",
  description: NETWORKING_ARTICLE.description,
  alternates: { canonical: "/documentation/tools/networking" },
  openGraph: {
    title: NETWORKING_ARTICLE.title,
    description: NETWORKING_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/tools/networking",
  },
}

export default function NetworkingDocumentationPage() {
  return <NetworkingArticlePage />
}
