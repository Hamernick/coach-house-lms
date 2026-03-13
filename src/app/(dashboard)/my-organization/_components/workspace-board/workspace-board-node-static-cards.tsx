"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import ImageIcon from "lucide-react/dist/esm/icons/image"

import {
  normalizeToList,
} from "@/components/organization/org-profile-card/utils"
import { GridBackground } from "@/components/ui/grid-background"
import { Progress } from "@/components/ui/progress"
import { ORG_BANNER_ASPECT_RATIO } from "@/lib/organization/banner-spec"
import { cn } from "@/lib/utils"

import type {
  WorkspaceCardSize,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "./workspace-board-types"

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

function useImageLoaded(src: string) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  return { loaded, setLoaded }
}

export function resolveOrganizationOverviewDisplayPrograms({
  programsCount,
  legacyProgramsValue,
}: {
  programsCount: number
  legacyProgramsValue?: string | null
}) {
  if (programsCount > 0) return programsCount
  return normalizeToList(legacyProgramsValue).length
}

export function OrganizationOverviewCard({
  size: _size,
  seed,
  presentationMode: _presentationMode,
  organizationEditorData,
}: {
  size: WorkspaceCardSize
  seed: WorkspaceSeedData
  presentationMode: boolean
  organizationEditorData?: WorkspaceOrganizationEditorData
}) {
  const headerUrl = safeText(seed.initialProfile.headerUrl)
  const logoUrl = safeText(seed.initialProfile.logoUrl)
  const displayTitle = seed.organizationTitle.trim() || "Title"
  const displaySubtitle = seed.organizationSubtitle.trim() || "Subtitle"
  const headerImage = useImageLoaded(headerUrl)
  const logoImage = useImageLoaded(logoUrl)
  const displayProgramsCount = resolveOrganizationOverviewDisplayPrograms({
    programsCount: organizationEditorData?.programs.length ?? seed.programsCount,
    legacyProgramsValue: organizationEditorData?.initialProfile.programs,
  })

  return (
    <div className="flex min-h-0 flex-col gap-2 pb-0.5">
      <div
        className="bg-muted/30 ring-border/50 relative min-h-[96px] w-full overflow-hidden rounded-[16px] ring-1"
        style={{ aspectRatio: ORG_BANNER_ASPECT_RATIO }}
      >
        {headerUrl ? (
          <>
            <Image
              src={headerUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 92vw, (max-width: 1280px) 520px, 760px"
              className={cn(
                "object-cover object-center transition-opacity duration-300",
                headerImage.loaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => headerImage.setLoaded(true)}
            />
            <div
              aria-hidden
              className={cn(
                "from-muted/70 via-muted/40 absolute inset-0 bg-gradient-to-br to-transparent transition-opacity duration-300",
                headerImage.loaded ? "opacity-0" : "opacity-100",
              )}
            />
          </>
        ) : (
          <GridBackground className="rounded-[16px]" />
        )}
      </div>

      <div className="flex min-w-0 items-start gap-2.5">
        <div className="bg-background ring-border/60 relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] ring-1">
          {logoUrl ? (
            <>
              <Image
                src={logoUrl}
                alt=""
                fill
                priority
                sizes="44px"
                className={cn(
                  "object-cover transition-opacity duration-300",
                  logoImage.loaded ? "opacity-100" : "opacity-0",
                )}
                onLoad={() => logoImage.setLoaded(true)}
              />
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 bg-muted/55 transition-opacity duration-300",
                  logoImage.loaded ? "opacity-0" : "opacity-100",
                )}
              />
            </>
          ) : (
            <div className="text-muted-foreground grid h-full w-full place-items-center">
              <ImageIcon className="h-4 w-4" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-foreground line-clamp-2 text-lg font-semibold leading-6">
            {displayTitle}
          </h3>
          <p className="text-muted-foreground line-clamp-1 text-sm">
            {displaySubtitle}
          </p>
        </div>
      </div>

      <dl className="border-border/50 grid grid-cols-3 gap-2 border-t pt-2.5">
        <div className="min-w-0">
          <dt className="text-muted-foreground text-[10px]">Programs</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
            {displayProgramsCount}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-[10px]">
            {seed.peopleCount === 1 ? "Person" : "People"}
          </dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
            {seed.peopleCount}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground text-[10px]">Raising</dt>
          <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
            {compactUsd(seed.fundingGoalCents)}
          </dd>
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
        <div className="border-border/60 bg-background relative h-10 w-10 overflow-hidden rounded-[12px] border">
          {hasLogo ? (
            <Image
              src={logoUrl}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {hasLogo ? "Logo connected" : "Logo missing"}
          </p>
          <p className="text-muted-foreground text-xs">Identity baseline</p>
        </div>
      </div>

      <div className="border-border/50 border-t pt-2.5">
        <p className="text-muted-foreground text-xs">Description</p>
        <p className="text-foreground mt-1 line-clamp-3 text-sm">
          {hasBoilerplate
            ? boilerplate
            : "Add a concise public narrative for funders and press."}
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
    seed.fundingGoalCents > 0
      ? Math.min(
          100,
          Math.round((seed.raisedCents / seed.fundingGoalCents) * 100)
        )
      : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 pb-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Raised</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums">
            {compactUsd(seed.raisedCents)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Need</p>
          <p className="mt-1 truncate text-sm font-semibold tabular-nums">
            {compactUsd(seed.fundingGoalCents)}
          </p>
        </div>
      </div>
      <Progress value={progressPercent} className="h-1.5" />
    </div>
  )
}
