import type { Metadata } from "next"

import { BrandIdentityTool } from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: "Nonprofit Brand Identity Builder",
  description:
    "Build an accessible nonprofit brand guide, save it privately on your device, and download the complete system for free.",
  alternates: { canonical: "/documentation/toolbox/brand-identity" },
  openGraph: {
    title: "Free Nonprofit Brand Identity Builder",
    description:
      "Create a clear nonprofit brand system with live previews, accessibility checks, and portable exports.",
    type: "website",
    url: "https://coachhouse.app/documentation/toolbox/brand-identity",
  },
}

export default function BrandIdentityPage() {
  return <BrandIdentityTool />
}
