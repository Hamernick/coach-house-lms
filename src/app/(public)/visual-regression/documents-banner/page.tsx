import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { DocumentsTab } from "@/components/organization/org-profile-card/tabs/documents-tab"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function DocumentsBannerVisualRegressionPage({
  searchParams,
}: {
  searchParams: Promise<{ readOnly?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) {
    notFound()
  }
  const readOnly = (await searchParams).readOnly === "1"

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <DocumentsTab
          organizationId="visual-documents-org"
          userId="visual-documents-user"
          documents={null}
          policyEntries={[
            {
              id: "policy-1",
              title: "Funding signals prototype",
              summary: "Generated strategy document",
              status: "complete",
              categories: ["Fundraising"],
              programId: null,
              personIds: [],
              document: null,
              updatedAt: "2026-08-14T12:00:00.000Z",
            },
            {
              id: "policy-2",
              title: "Coach House Altum proposal",
              summary: "Organization proposal",
              status: "complete",
              categories: ["Operations"],
              programId: null,
              personIds: [],
              document: null,
              updatedAt: "2026-08-08T12:00:00.000Z",
            },
            {
              id: "policy-3",
              title: "Community resource maps directory",
              summary: "Working directory",
              status: "in_progress",
              categories: ["Communications"],
              programId: null,
              personIds: [],
              document: null,
              updatedAt: "2026-08-04T12:00:00.000Z",
            },
          ]}
          policyProgramOptions={[]}
          policyPeopleOptions={[]}
          roadmapSections={[
            ...["program", "people", "board_calendar", "next_actions"].map(
              (id) => ({
                id,
                title: (
                  {
                    program: "Program",
                    people: "People",
                    board_calendar: "Calendar",
                    next_actions: "Next Actions",
                  } as Record<string, string>
                )[id],
                subtitle: "",
                slug: id.replaceAll("_", "-"),
                status: "not_started" as const,
                lastUpdated: null,
                isPublic: false,
              })
            ),
            {
              id: "budget",
              title: "Budget",
              subtitle: "Roadmap document",
              slug: "budget",
              status: "not_started",
              lastUpdated: null,
              isPublic: false,
            },
            {
              id: "board_strategy",
              title: "Board strategy",
              subtitle: "Roadmap document",
              slug: "board-strategy",
              status: "not_started",
              lastUpdated: null,
              isPublic: false,
            },
            {
              id: "fundraising_strategy",
              title: "Fundraising strategy",
              subtitle: "Roadmap document",
              slug: "fundraising-strategy",
              status: "complete",
              lastUpdated: "2026-08-14T12:00:00.000Z",
              isPublic: false,
            },
            {
              id: "mission_vision_values",
              title: "Mission, vision, and values",
              subtitle: "Roadmap document",
              slug: "mission-vision-values",
              status: "complete",
              lastUpdated: "2026-08-11T12:00:00.000Z",
              isPublic: false,
            },
            {
              id: "communications",
              title: "Communications plan",
              subtitle: "Roadmap document",
              slug: "communications",
              status: "in_progress",
              lastUpdated: "2026-08-02T12:00:00.000Z",
              isPublic: false,
            },
          ]}
          editMode
          canEdit={!readOnly}
        />
      </div>
    </main>
  )
}
