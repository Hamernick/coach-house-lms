import Link from "next/link"
import { ProgramBuilderDashboardCard } from "@/components/organization/program-builder-dashboard-card"
import {
  MY_ORGANIZATION_BENTO_GRID_CLASS,
  resolveMyOrganizationBentoCardClass,
} from "@/components/organization/my-organization-bento-rules"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { Button } from "@/components/ui/button"
import type { OrgProfile, OrgProgram } from "@/components/organization/org-profile-card/types"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

import type { FormationSummary, MyOrganizationCalendarView } from "../../../_lib/types"
import { MyOrganizationCalendarCard } from "./my-organization-calendar-card"
import { MyOrganizationFormationCard } from "./my-organization-formation-card"
import { MyOrganizationOverviewCard } from "./my-organization-overview-card"
import { MyOrganizationTeamCard } from "./my-organization-team-card"

type MyOrganizationDashboardViewProps = {
  initialProfile: OrgProfile
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  programsCount: number
  peopleCount: number
  people: OrgPersonWithImage[]
  programs: OrgProgram[]
  hasPaidPlan: boolean
  showLaunchRoadmapCard: boolean
  showTeamCard: boolean
  calendar: MyOrganizationCalendarView
  formationSummary: FormationSummary
}

export function MyOrganizationDashboardView({
  initialProfile,
  organizationTitle,
  organizationSubtitle,
  fundingGoalCents,
  programsCount,
  peopleCount,
  people,
  programs,
  hasPaidPlan,
  showLaunchRoadmapCard,
  showTeamCard,
  calendar,
  formationSummary,
}: MyOrganizationDashboardViewProps) {
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <PageTutorialButton tutorial="my-organization" />
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">Organization dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Open the workspace for layout editing or share the view-only workspace with collaborators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="h-8">
            <Link href="/workspace">Open workspace</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link href="/workspace/present">Open shared workspace</Link>
          </Button>
        </div>
      </section>

      <section className={MY_ORGANIZATION_BENTO_GRID_CLASS} data-tour="dashboard-overview">
        <MyOrganizationOverviewCard
          className={resolveMyOrganizationBentoCardClass("profile", { showLaunchRoadmapCard })}
          initialProfile={initialProfile}
          organizationTitle={organizationTitle}
          organizationSubtitle={organizationSubtitle}
          fundingGoalCents={fundingGoalCents}
          programsCount={programsCount}
          peopleCount={peopleCount}
          teamMembersCount={people.length}
        />

        <MyOrganizationCalendarCard
          className={resolveMyOrganizationBentoCardClass("calendar", { showLaunchRoadmapCard })}
          calendar={calendar}
        />

        {showLaunchRoadmapCard ? (
          <MyOrganizationFormationCard
            className={resolveMyOrganizationBentoCardClass("launchRoadmap", { showLaunchRoadmapCard })}
            hasPaidPlan={hasPaidPlan}
            summary={formationSummary}
          />
        ) : null}

        <ProgramBuilderDashboardCard
          programs={programs}
          className={resolveMyOrganizationBentoCardClass("programBuilder", { showLaunchRoadmapCard })}
        />

        {showTeamCard ? (
          <MyOrganizationTeamCard
            people={people}
            className={resolveMyOrganizationBentoCardClass("team", { showLaunchRoadmapCard })}
          />
        ) : null}
      </section>
      <div aria-hidden className="h-5 shrink-0 md:h-6" />
    </div>
  )
}
