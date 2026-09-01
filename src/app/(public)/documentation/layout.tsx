import type { Metadata } from "next"
import type { ReactNode } from "react"

import { resolveDashboardLayoutState } from "@/app/(dashboard)/_lib/dashboard-layout-state"
import { readAppSidebarDefaultOpen } from "@/components/app-shell/sidebar-state-server"
import { DocumentationShell } from "@/features/nonprofit-documentation"

export const metadata: Metadata = {
  title: {
    default: "Nonprofit documentation",
    template: "%s · Coach House Documentation",
  },
  description:
    "Stage-specific guidance for starting and operating sustainable nonprofit organizations in the United States.",
  alternates: { canonical: "/documentation" },
  openGraph: {
    title: "Coach House Nonprofit Documentation",
    description:
      "Practical guidance for nonprofit founders and operators, organized by stage.",
    type: "website",
    url: "https://coachhouse.app/documentation",
  },
}

export default async function DocumentationLayout({
  children,
}: {
  children: ReactNode
}) {
  const [shellState, defaultSidebarOpen] = await Promise.all([
    resolveDashboardLayoutState(),
    readAppSidebarDefaultOpen(),
  ])

  return (
    <DocumentationShell
      state={shellState.userPresent ? shellState : null}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </DocumentationShell>
  )
}
