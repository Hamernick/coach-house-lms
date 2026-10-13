"use client"

import Image from "next/image"

import { Progress } from "@/components/ui/progress"
import { ORG_BANNER_ASPECT_RATIO } from "@/lib/organization/banner-spec"

import type { WorkspaceCardSize, WorkspaceSeedData } from "./workspace-board-types"

function compactUsd(cents: number) {
  const dollars = Math.max(0, cents) / 100
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(dollars)
}

function safeText(value: string | null | undefined) {
  return typeof value === "string" ? value : ""
}

export function OrganizationOverviewCard({
  size,
  seed,
  presentationMode,
}: {
  size: WorkspaceCardSize
  seed: WorkspaceSeedData
  presentationMode: boolean
}) {
  const headerUrl = safeText(seed.initialProfile.headerUrl)
  const logoUrl = safeText(seed.initialProfile.logoUrl)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div
        className="relative w-full overflow-hidden rounded-[16px] bg-muted/30 ring-1 ring-border/50"
        style={{ aspectRatio: ORG_BANNER_ASPECT_RATIO }}
      >
        {headerUrl ? (
          <Image
            src={headerUrl}
            alt=""
            fill
            sizes={
              presentationMode || size === "md"
                ? "100vw"
                : "(max-width: 768px) 90vw, (max-width: 1280px) 520px, 760px"
            }
            quality={95}
            className="object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted/70 via-muted/40 to-transparent" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 items-start gap-2.5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-background ring-1 ring-border/60">
          {logoUrl ? (
            <Image src={logoUrl} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-muted-foreground">LOGO</div>
          )}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-semibold text-foreground">{seed.organizationTitle}</p>
          {seed.organizationSubtitle ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">{seed.organizationSubtitle}</p>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-border/50 pt-2.5">
        <div className="min-w-0">
          <dt className="text-[10px] text-muted-foreground">Programs</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">{seed.programsCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] text-muted-foreground">People</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">{seed.peopleCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] text-muted-foreground">Goal</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">{compactUsd(seed.fundingGoalCents)}</dd>
        </div>
      </dl>
    </div>
  )
}

export function BrandKitCard({
  size,
  seed,
  presentationMode,
}: {
  size: WorkspaceCardSize
  seed: WorkspaceSeedData
  presentationMode: boolean
}) {
  const logoUrl = safeText(seed.initialProfile.logoUrl)
  const boilerplate = safeText(seed.initialProfile.boilerplate)
  const hasLogo = logoUrl.length > 0
  const hasBoilerplate = boilerplate.length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 pb-3">
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <div className="relative h-10 w-10 overflow-hidden rounded-[12px] border border-border/60 bg-background">
          {hasLogo ? <Image src={logoUrl} alt="" fill sizes="40px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{hasLogo ? "Logo connected" : "Logo missing"}</p>
          <p className="text-xs text-muted-foreground">Identity baseline</p>
        </div>
      </div>

      <div className="border-t border-border/50 pt-2.5">
        <p className="text-xs text-muted-foreground">Description</p>
        <p className="mt-1 line-clamp-3 text-sm text-foreground">
          {hasBoilerplate ? boilerplate : "Add a concise public narrative for funders and press."}
        </p>
      </div>

    </div>
  )
}

export function EconomicEngineCard({
  size,
  seed,
  presentationMode,
}: {
  size: WorkspaceCardSize
  seed: WorkspaceSeedData
  presentationMode: boolean
}) {
  const progressPercent =
    seed.fundingGoalCents > 0 ? Math.min(100, Math.round((seed.raisedCents / seed.fundingGoalCents) * 100)) : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 pb-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Raised</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums">{compactUsd(seed.raisedCents)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Target</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums">{compactUsd(seed.fundingGoalCents)}</p>
        </div>
      </div>
      <Progress value={progressPercent} className="h-1.5" />

      <div className="border-t border-border/50 pt-3">
        <p className="text-xs text-muted-foreground">Pipeline signal</p>
        <p className="mt-1 text-sm font-medium">
          {seed.programsCount > 0
            ? `${seed.programsCount} active program${seed.programsCount === 1 ? "" : "s"} feeding fundraising asks`
            : "No active programs yet"}
        </p>
      </div>
    </div>
  )
}
