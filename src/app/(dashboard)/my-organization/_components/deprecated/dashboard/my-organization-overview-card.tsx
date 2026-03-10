import Image from "next/image"
import Link from "next/link"

import type { OrgProfile } from "@/components/organization/org-profile-card/types"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { ORG_HEADER_SQUARES } from "../../../_lib/constants"
import { formatFundingGoal } from "../../../_lib/helpers"

type MyOrganizationOverviewCardProps = {
  initialProfile: OrgProfile
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  programsCount: number
  peopleCount: number
  teamMembersCount: number
  className?: string
}

function resolveFormationStatusLabel(status: OrgProfile["formationStatus"]) {
  if (status === "approved") return "IRS Approved"
  if (status === "pre_501c3") return "Pre-501(c)(3)"
  return "In progress"
}

export function MyOrganizationOverviewCard({
  initialProfile,
  organizationTitle,
  organizationSubtitle,
  fundingGoalCents,
  programsCount,
  peopleCount,
  teamMembersCount,
  className,
}: MyOrganizationOverviewCardProps) {
  return (
    <Card className={cn(className, "flex flex-col")} data-bento-card="profile">
      <CardHeader className="pb-1">
        <CardTitle className="text-xl">Organization</CardTitle>
        {organizationSubtitle ? <CardDescription className="line-clamp-2">{organizationSubtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-1">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
          <div className="relative h-24 overflow-hidden bg-background">
            {initialProfile.headerUrl ? (
              <Image src={initialProfile.headerUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 480px" className="object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/10 to-background/40" />
            <GridPattern
              patternId="my-organization-workspace-header-pattern"
              squares={ORG_HEADER_SQUARES}
              className={cn(
                "inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(260px_circle_at_center,white,transparent)]",
                initialProfile.headerUrl ? "opacity-40" : "opacity-70",
              )}
            />
          </div>
          <div className="relative px-3 pb-3 pt-8">
            <div className="absolute left-3 top-[-22px] h-12 w-12 overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
              {initialProfile.logoUrl ? (
                <Image src={initialProfile.logoUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[10px] font-semibold tracking-wide text-muted-foreground">
                  LOGO
                </span>
              )}
            </div>
            <p className="truncate text-base font-semibold text-foreground">{organizationTitle}</p>
            {organizationSubtitle ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{organizationSubtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-background/30 p-1" data-tour="dashboard-stats">
          <Link
            href="/organization?view=editor&tab=programs"
            className="rounded-md px-2 py-2 transition hover:bg-muted/40"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Funding goal</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatFundingGoal(fundingGoalCents)}</p>
          </Link>
          <Link
            href="/organization?view=editor&tab=programs"
            className="rounded-md px-2 py-2 transition hover:bg-muted/40"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Programs</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{programsCount}</p>
          </Link>
          <Link
            href="/organization?view=editor&tab=people"
            className="rounded-md px-2 py-2 transition hover:bg-muted/40"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">People</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{peopleCount}</p>
          </Link>
        </div>

        <dl className="divide-y divide-border/50 rounded-lg border border-border/60 bg-background/20 text-sm">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Formation</dt>
            <dd className="font-medium text-right">
              {resolveFormationStatusLabel(initialProfile.formationStatus)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Programs</dt>
            <dd className="font-medium tabular-nums">{programsCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">Team members</dt>
            <dd className="font-medium tabular-nums">{teamMembersCount}</dd>
          </div>
        </dl>

        <div className="mt-auto grid gap-2 pt-1" data-tour="dashboard-actions">
          <Button asChild size="sm" className="h-9 w-full">
            <Link href="/organization?view=editor">Edit organization</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 w-full">
            <Link href="/workspace">Open workspace</Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-9 w-full">
            <Link href="/workspace/present">Open shared workspace</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
