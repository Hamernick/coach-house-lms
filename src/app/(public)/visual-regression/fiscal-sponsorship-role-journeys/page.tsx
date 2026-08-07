import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { FiscalSponsorshipRoleJourneyFixture } from "./fixture"

export const metadata: Metadata = {
  title: "Fiscal sponsorship role journey fixture",
  robots: { index: false, follow: false },
}

export default function FiscalSponsorshipRoleJourneyFixturePage() {
  if (process.env.NODE_ENV === "production") notFound()

  return <FiscalSponsorshipRoleJourneyFixture />
}
