import { Suspense } from "react"

import { ClientOnly } from "@/components/client-only"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { OrgChartCanvasLite } from "@/components/people/org-chart-canvas-lite"
import { OrgChartSkeleton } from "@/components/people/org-chart-skeleton"
import { PeopleTableShell } from "@/components/people/people-table"
import { Separator } from "@/components/ui/separator"
import type { OrgPerson } from "@/actions/people"
import type { MemberWorkspacePeoplePageData } from "../../types"
import { MemberWorkspaceAdminPeoplePage } from "./member-workspace-admin-people-page"

type OrganizationPeopleProps = {
  mode: "organization"
  people: (OrgPerson & { displayImage: string | null })[]
  canEdit: boolean
}

export function MemberWorkspacePeoplePage(props: MemberWorkspacePeoplePageData) {
  if (props.mode === "platform-admin") {
    return (
      <MemberWorkspaceAdminPeoplePage
        organizations={props.organizations}
        summary={props.summary}
      />
    )
  }

  const { people, canEdit } = props as OrganizationPeopleProps

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageTutorialButton tutorial="people" />
      <section>
        <Suspense fallback={<OrgChartSkeleton />}>
          <OrgChartCanvasLite people={people} canEdit={canEdit} />
        </Suspense>
      </section>

      <section>
        <h2 className="text-lg font-semibold">People</h2>
        <Separator className="my-3" />
        <ClientOnly
          fallback={
            <div className="rounded-md border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
              Loading people…
            </div>
          }
        >
          <PeopleTableShell people={people} canEdit={canEdit} controlsPlacement="inline" />
        </ClientOnly>
      </section>
    </div>
  )
}
