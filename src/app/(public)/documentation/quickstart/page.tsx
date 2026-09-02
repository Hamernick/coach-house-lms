import type { Metadata } from "next"

import {
  FoundationGuidePage,
  QUICKSTART_GUIDE,
} from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit quickstart",
  description: QUICKSTART_GUIDE.description,
  alternates: { canonical: "/documentation/quickstart" },
  openGraph: {
    title: "Nonprofit quickstart · Coach House Documentation",
    description: QUICKSTART_GUIDE.description,
    type: "article",
    url: "https://coachhouse.app/documentation/quickstart",
  },
}

export default function QuickstartPage() {
  return <FoundationGuidePage guide={QUICKSTART_GUIDE} />
}
