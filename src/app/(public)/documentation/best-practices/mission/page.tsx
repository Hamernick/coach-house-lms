import type { Metadata } from "next"

import {
  MISSION_ARTICLE,
  MissionArticlePage,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "How to write a nonprofit mission",
  description: MISSION_ARTICLE.description,
  alternates: {
    canonical: "/documentation/best-practices/mission",
  },
  openGraph: {
    title: MISSION_ARTICLE.title,
    description: MISSION_ARTICLE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/best-practices/mission",
  },
}

export default function MissionDocumentationPage() {
  return <MissionArticlePage />
}
