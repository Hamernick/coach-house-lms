import type { Metadata } from "next"

import HomeTwoPage from "./home2/page"

export const metadata: Metadata = {
  title: "Coach House",
  description: "A nonprofit platform for formation, planning, and public-ready storytelling.",
}

export const runtime = "edge"
export const revalidate = 86400

export default function LandingPage() {
  return <HomeTwoPage />
}
