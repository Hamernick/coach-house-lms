import type { Metadata } from "next"

import {
  FoundationGuidePage,
  KEY_CONCEPTS_GUIDE,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit key concepts",
  description: KEY_CONCEPTS_GUIDE.description,
  alternates: { canonical: "/documentation/key-concepts" },
  openGraph: {
    title: "Nonprofit key concepts · Coach House Documentation",
    description: KEY_CONCEPTS_GUIDE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/key-concepts",
  },
}

export default function KeyConceptsPage() {
  return <FoundationGuidePage guide={KEY_CONCEPTS_GUIDE} />
}
