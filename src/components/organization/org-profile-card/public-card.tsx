"use client"

import { useMemo } from "react"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProgramCard } from "@/components/programs/program-card"
import { PeopleShowcase, SupportersShowcase } from "@/components/people/supporters-showcase"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import Image from "next/image"

import type { OrgProfile, OrgProgram } from "./types"
import { buildAddressLines, dateRangeChip, locationSummary } from "./utils"
import { AddressDisplay, BrandLink, FieldText, FormRow, ProfileField } from "./shared"
import { stripHtml } from "@/lib/markdown/convert"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

function hasValue(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0
}

const SOCIAL_FIELDS: Array<{
  label: string
  key: keyof Pick<OrgProfile, "twitter" | "facebook" | "linkedin" | "instagram" | "youtube" | "tiktok" | "github">
  icon: keyof typeof PROVIDER_ICON
}> = [
  { label: "Twitter / X", key: "twitter", icon: "link" },
  { label: "Facebook", key: "facebook", icon: "facebook" },
  { label: "LinkedIn", key: "linkedin", icon: "linkedin" },
  { label: "Instagram", key: "instagram", icon: "instagram" },
  { label: "YouTube", key: "youtube", icon: "youtube" },
  { label: "TikTok", key: "tiktok", icon: "link" },
  { label: "GitHub", key: "github", icon: "github" },
]

function createIcon(slug: keyof typeof PROVIDER_ICON) {
  const Icon = PROVIDER_ICON[slug] ?? PROVIDER_ICON.generic
  return <Icon className="h-4 w-4" />
}

const headerSquares: Array<[number, number]> = [
  [4, 4],
  [5, 1],
  [8, 2],
  [5, 3],
  [5, 5],
  [10, 10],
  [12, 15],
  [15, 10],
  [10, 15],
  [15, 10],
  [10, 15],
  [15, 10],
]

export type OrgProfilePublicCardProps = {
  profile: OrgProfile
  people: OrgPersonWithImage[]
  programs?: OrgProgram[]
}

export function OrgProfilePublicCard({ profile, people, programs = [] }: OrgProfilePublicCardProps) {
  const addressLines = useMemo(
    () =>
      buildAddressLines({
        street: profile.addressStreet,
        city: profile.addressCity,
        state: profile.addressState,
        postal: profile.addressPostal,
        country: profile.addressCountry,
        fallback: profile.address,
      }),
    [
      profile.address,
      profile.addressStreet,
      profile.addressCity,
      profile.addressState,
      profile.addressPostal,
      profile.addressCountry,
    ],
  )

  const staff = people.filter((p) => p.category === "staff")
  const board = people.filter((p) => p.category === "board")
  const supporters = people.filter((p) => p.category === "supporter")

  const hasPrograms = programs.length > 0
  const hasPeople = staff.length > 0 || board.length > 0
  const hasSupporters = supporters.length > 0

  const description = typeof profile.description === "string" ? stripHtml(profile.description) : ""
  const mission = typeof profile.mission === "string" ? stripHtml(profile.mission) : ""
  const vision = typeof profile.vision === "string" ? stripHtml(profile.vision) : ""
  const values = typeof profile.values === "string" ? stripHtml(profile.values) : ""
  const boilerplate = typeof profile.boilerplate === "string" ? stripHtml(profile.boilerplate) : ""

  return (
    <Card className="w-full overflow-hidden bg-card/70 py-0 pb-10 shadow-xl shadow-black/10">
      <div className="relative h-36 w-full overflow-hidden border-b bg-background">
        <GridPattern
          patternId="org-public-header-pattern"
          squares={headerSquares}
          className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 opacity-70 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)]"
        />
      </div>

      <div className="relative p-6 sm:px-10 sm:pb-10">
        <div className="absolute -top-12 left-6 flex items-center gap-3 sm:left-10">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {hasValue(profile.logoUrl) ? (
              <Image
                src={profile.logoUrl as string}
                alt={profile.name ?? "Organization"}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">LOGO</div>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{profile.name || "Organization"}</h1>
            <p className="text-sm text-muted-foreground">{profile.tagline && profile.tagline.trim() ? profile.tagline : "—"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasValue(profile.publicUrl) ? (
              <Link
                href={profile.publicUrl as string}
                target="_blank"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {createIcon("link")}
                <span className="sr-only">Website</span>
              </Link>
            ) : null}
            {hasValue(profile.newsletter) ? (
              <Link
                href={profile.newsletter as string}
                target="_blank"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {createIcon("link")}
                <span className="sr-only">Newsletter</span>
              </Link>
            ) : null}
            {hasValue(profile.email) ? (
              <Link
                href={`mailto:${profile.email}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {createIcon("email")}
                <span className="sr-only">Email</span>
              </Link>
            ) : null}
            {SOCIAL_FIELDS.map(({ key, icon }) =>
              hasValue(profile[key]) ? (
                <Link
                  key={key}
                  href={profile[key] as string}
                  target="_blank"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {createIcon(icon)}
                  <span className="sr-only">{key}</span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <CardContent className="space-y-12 px-6 pt-0 sm:px-10">
        <Separator />

        <FormRow title="About" description="Mission, vision, and values">
          <div className="space-y-4 text-sm">
            {description.trim().length > 0 ? <FieldText text={description} multiline /> : null}
            {mission.trim().length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mission</p>
                <FieldText text={mission} multiline />
              </div>
            ) : null}
            {vision.trim().length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vision</p>
                <FieldText text={vision} multiline />
              </div>
            ) : null}
            {values.trim().length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Values</p>
                <FieldText text={values} multiline />
              </div>
            ) : null}
          </div>
        </FormRow>

        <Separator />

        <FormRow title="Details" description="How to connect">
          <div className="space-y-6">
            {addressLines.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Headquarters</p>
                <AddressDisplay lines={addressLines} />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {hasValue(profile.publicUrl) ? (
                <ProfileField label="Website">
                  <BrandLink href={profile.publicUrl as string} />
                </ProfileField>
              ) : null}
              {hasValue(profile.newsletter) ? (
                <ProfileField label="Newsletter">
                  <BrandLink href={profile.newsletter as string} />
                </ProfileField>
              ) : null}
              {SOCIAL_FIELDS.map(({ label, key }) =>
                hasValue(profile[key]) ? (
                  <ProfileField key={key} label={label}>
                    <BrandLink href={profile[key] as string} />
                  </ProfileField>
                ) : null,
              )}
            </div>
          </div>
        </FormRow>

        {hasPrograms ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Programs</h2>
                <p className="text-sm text-muted-foreground">Highlights from the organization</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  title={program.title ?? "Untitled program"}
                  org={profile.name || undefined}
                  location={locationSummary(program) || undefined}
                  imageUrl={program.image_url || undefined}
                  statusLabel={program.status_label || (program.is_public ? undefined : "Private") || undefined}
                  chips={
                    [dateRangeChip(program.start_date, program.end_date) || program.duration_label]
                      .concat(Array.isArray(program.features) ? program.features : [])
                      .filter(Boolean) as string[]
                  }
                  goalCents={program.goal_cents || 0}
                  raisedCents={program.raised_cents || 0}
                  ctaLabel={program.cta_label || "Learn more"}
                  ctaHref={program.cta_url || undefined}
                  patternId={`program-card-${program.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {(hasPeople || hasSupporters) ? <Separator /> : null}

        {staff.length > 0 ? (
          <>
            <FormRow title="Team" description="Who leads the work">
              <PeopleShowcase people={staff} allPeople={people} emptyMessage="" variant="public" />
            </FormRow>
            {(board.length > 0 || hasSupporters || hasValue(profile.boilerplate)) ? <Separator /> : null}
          </>
        ) : null}

        {board.length > 0 ? (
          <>
            <FormRow title="Board" description="Governance & advisors">
              <PeopleShowcase people={board} allPeople={people} emptyMessage="" variant="public" />
            </FormRow>
            {hasSupporters || boilerplate.trim().length > 0 ? <Separator /> : null}
          </>
        ) : null}

        {hasSupporters ? (
          <>
            <FormRow title="Supporters" description="Partners and champions">
              <SupportersShowcase supporters={supporters} allPeople={people} emptyMessage="" variant="public" />
            </FormRow>
            {boilerplate.trim().length > 0 ? <Separator /> : null}
          </>
        ) : null}

        {boilerplate.trim().length > 0 ? (
          <FormRow title="Boilerplate" description="Shareable summary">
            <FieldText text={boilerplate} multiline />
          </FormRow>
        ) : null}
      </CardContent>
    </Card>
  )
}
