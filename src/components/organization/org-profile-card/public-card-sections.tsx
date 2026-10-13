import Link from "next/link"
import Image from "next/image"

import { ProgramCard } from "@/components/programs/program-card"
import {
  PeopleShowcase,
  SupportersShowcase,
} from "@/components/people/supporters-showcase"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  resolveProgramBannerImageUrl,
  resolveProgramCardChips,
  resolveProgramProfileImageUrl,
  resolveProgramSummary,
} from "@/lib/programs/display"
import { ORG_BANNER_ASPECT_RATIO } from "@/lib/organization/banner-spec"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

import type { OrgProfile, OrgProgram } from "./types"
import { locationSummary } from "./utils"
import {
  AddressDisplay,
  BrandLink,
  FieldText,
  FormRow,
  ProfileField,
} from "./shared"

export function hasPublicProfileValue(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0
}

export const PUBLIC_CARD_SOCIAL_FIELDS: Array<{
  label: string
  key: keyof Pick<
    OrgProfile,
    | "twitter"
    | "facebook"
    | "linkedin"
    | "instagram"
    | "youtube"
    | "tiktok"
    | "github"
  >
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

const HEADER_SQUARES: Array<[number, number]> = [
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

function createIcon(slug: keyof typeof PROVIDER_ICON) {
  const Icon = PROVIDER_ICON[slug] ?? PROVIDER_ICON.generic
  return <Icon className="h-4 w-4" />
}

export function OrgProfilePublicHeader({
  profile,
}: {
  profile: OrgProfile
}) {
  const hasHeaderImage = hasPublicProfileValue(profile.headerUrl)

  return (
    <>
      <div
        className="bg-background relative w-full overflow-hidden border-b"
        style={{ aspectRatio: ORG_BANNER_ASPECT_RATIO }}
      >
        {hasHeaderImage ? (
          <Image
            src={profile.headerUrl as string}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 1024px"
            loading="eager"
          />
        ) : null}
        {!hasHeaderImage ? (
          <>
            <div className="from-background/5 via-background/10 to-background/40 absolute inset-0 bg-gradient-to-b" />
            <GridPattern
              patternId="org-public-header-pattern"
              squares={HEADER_SQUARES}
              className={cn(
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)] opacity-70"
              )}
            />
          </>
        ) : null}
      </div>

      <div className="relative p-5 sm:px-10 sm:pb-10">
        <div className="absolute -top-10 left-4 flex items-center gap-3 sm:-top-12 sm:left-10">
          <div className="border-border bg-background relative h-20 w-20 overflow-hidden rounded-xl border shadow-sm sm:h-24 sm:w-24">
            {hasPublicProfileValue(profile.logoUrl) ? (
              <Image
                src={profile.logoUrl as string}
                alt={profile.name ?? "Organization"}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="text-muted-foreground grid h-full w-full place-items-center text-sm">
                LOGO
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:mt-14">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.name || "Organization"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {profile.tagline && profile.tagline.trim() ? profile.tagline : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasPublicProfileValue(profile.publicUrl) ? (
              <Link
                href={profile.publicUrl as string}
                target="_blank"
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("link")}
                <span className="sr-only">Website</span>
              </Link>
            ) : null}
            {hasPublicProfileValue(profile.newsletter) ? (
              <Link
                href={profile.newsletter as string}
                target="_blank"
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("link")}
                <span className="sr-only">Newsletter</span>
              </Link>
            ) : null}
            {hasPublicProfileValue(profile.email) ? (
              <Link
                href={`mailto:${profile.email}`}
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("email")}
                <span className="sr-only">Email</span>
              </Link>
            ) : null}
            {PUBLIC_CARD_SOCIAL_FIELDS.map(({ key, icon }) =>
              hasPublicProfileValue(profile[key]) ? (
                <Link
                  key={key}
                  href={profile[key] as string}
                  target="_blank"
                  className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
                >
                  {createIcon(icon)}
                  <span className="sr-only">{key}</span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function OrgProfilePublicAboutSection({
  description,
  mission,
  vision,
  values,
}: {
  description: string
  mission: string
  vision: string
  values: string
}) {
  return (
    <FormRow
      title="About"
      description="Mission, vision, and values"
      inset={false}
    >
      <div className="space-y-4 text-sm">
        {description.trim().length > 0 ? (
          <FieldText text={description} multiline />
        ) : null}
        {mission.trim().length > 0 ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Mission
            </p>
            <FieldText text={mission} multiline />
          </div>
        ) : null}
        {vision.trim().length > 0 ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Vision
            </p>
            <FieldText text={vision} multiline />
          </div>
        ) : null}
        {values.trim().length > 0 ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Values
            </p>
            <FieldText text={values} multiline />
          </div>
        ) : null}
      </div>
    </FormRow>
  )
}

export function OrgProfilePublicDetailsSection({
  profile,
  addressLines,
}: {
  profile: OrgProfile
  addressLines: string[]
}) {
  return (
    <FormRow title="Details" description="How to connect" inset={false}>
      <div className="space-y-6">
        {addressLines.length > 0 ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Headquarters
            </p>
            <AddressDisplay lines={addressLines} />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {hasPublicProfileValue(profile.publicUrl) ? (
            <ProfileField label="Website">
              <BrandLink href={profile.publicUrl as string} />
            </ProfileField>
          ) : null}
          {hasPublicProfileValue(profile.newsletter) ? (
            <ProfileField label="Newsletter">
              <BrandLink href={profile.newsletter as string} />
            </ProfileField>
          ) : null}
          {PUBLIC_CARD_SOCIAL_FIELDS.map(({ label, key }) =>
            hasPublicProfileValue(profile[key]) ? (
              <ProfileField key={key} label={label}>
                <BrandLink href={profile[key] as string} />
              </ProfileField>
            ) : null
          )}
        </div>
      </div>
    </FormRow>
  )
}

export function OrgProfilePublicProgramsSection({
  profileName,
  programs,
  selectedProgramId,
}: {
  profileName: string | null | undefined
  programs: OrgProgram[]
  selectedProgramId: string | null
}) {
  return (
    <section id="programs" className="scroll-mt-20 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Programs</h2>
          <p className="text-muted-foreground text-sm">
            {selectedProgramId
              ? "Focused view from map discovery"
              : "Highlights from the organization"}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <div
            key={program.id}
            id={`program-${program.id}`}
            className={cn(
              "scroll-mt-20",
              selectedProgramId === program.id &&
                "ring-primary/35 ring-offset-background rounded-3xl ring-2 ring-offset-2"
            )}
          >
            <ProgramCard
              variant="medium"
              title={program.title ?? "Untitled program"}
              org={profileName || undefined}
              location={locationSummary(program) || undefined}
              description={resolveProgramSummary(program) || undefined}
              bannerImageUrl={resolveProgramBannerImageUrl(program) || undefined}
              imageUrl={resolveProgramProfileImageUrl(program) || undefined}
              statusLabel={
                program.status_label ||
                (program.is_public ? undefined : "Private") ||
                undefined
              }
              chips={resolveProgramCardChips(program)}
              goalCents={program.goal_cents || 0}
              raisedCents={program.raised_cents || 0}
              ctaLabel={program.cta_label || "Learn more"}
              ctaHref={program.cta_url || undefined}
              patternId={`program-card-${program.id}`}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export function OrgProfilePublicPeopleSections({
  people,
  staff,
  governingBoard,
  advisoryBoard,
  supporterRoster,
  showBoilerplateSeparator,
}: {
  people: OrgPersonWithImage[]
  staff: OrgPersonWithImage[]
  governingBoard: OrgPersonWithImage[]
  advisoryBoard: OrgPersonWithImage[]
  supporterRoster: OrgPersonWithImage[]
  showBoilerplateSeparator: boolean
}) {
  const hasSupporters = supporterRoster.length > 0

  return (
    <>
      {staff.length > 0 ? (
        <>
          <FormRow
            title="Team"
            description="Who leads the work"
            inset={false}
          >
            <PeopleShowcase
              people={staff}
              allPeople={people}
              emptyMessage=""
              variant="public"
            />
          </FormRow>
          {governingBoard.length > 0 ||
          advisoryBoard.length > 0 ||
          hasSupporters ||
          showBoilerplateSeparator ? (
            <Separator />
          ) : null}
        </>
      ) : null}

      {governingBoard.length > 0 ? (
        <>
          <FormRow
            title="Governing board"
            description="Governance"
            inset={false}
          >
            <PeopleShowcase
              people={governingBoard}
              allPeople={people}
              emptyMessage=""
              variant="public"
            />
          </FormRow>
          {advisoryBoard.length > 0 ||
          hasSupporters ||
          showBoilerplateSeparator ? (
            <Separator />
          ) : null}
        </>
      ) : null}

      {advisoryBoard.length > 0 ? (
        <>
          <FormRow
            title="Advisory board"
            description="Advisors and subject matter experts"
            inset={false}
          >
            <PeopleShowcase
              people={advisoryBoard}
              allPeople={people}
              emptyMessage=""
              variant="public"
            />
          </FormRow>
          {hasSupporters || showBoilerplateSeparator ? <Separator /> : null}
        </>
      ) : null}

      {hasSupporters ? (
        <>
          <FormRow
            title="Supporters"
            description="Foundations, corporate partners, and volunteers"
            inset={false}
          >
            <SupportersShowcase
              supporters={supporterRoster}
              allPeople={people}
              emptyMessage=""
              variant="public"
            />
          </FormRow>
          {showBoilerplateSeparator ? <Separator /> : null}
        </>
      ) : null}
    </>
  )
}
