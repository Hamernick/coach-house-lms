import type { Metadata } from "next"
import { Suspense } from "react"

import {
  PublicFindRoute,
  PublicFindRouteLoading,
  type PublicFindRouteProps,
} from "@/features/find-map"

export const metadata: Metadata = {
  title: "Find resources and organizations",
  description:
    "Search public organizations, programs, and community resources on Coach House.",
  alternates: { canonical: "/" },
}

export const revalidate = 300

export default function RootFindPage(props: PublicFindRouteProps) {
  return (
    <Suspense fallback={<PublicFindRouteLoading />}>
      <PublicFindRoute {...props} />
    </Suspense>
  )
}
