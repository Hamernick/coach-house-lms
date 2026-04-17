"use client"

import { useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { OrgProfile, OrgProgram } from "./types"
import { buildAddressLines } from "./utils"
import { FieldText, FormRow } from "./shared"
import {
  OrgProfilePublicAboutSection,
  OrgProfilePublicDetailsSection,
  OrgProfilePublicHeader,
  OrgProfilePublicPeopleSections,
  OrgProfilePublicProgramsSection,
} from "./public-card-sections"
import { stripHtml } from "@/lib/markdown/convert"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

export type OrgProfilePublicCardProps = {
  profile: OrgProfile
  people: OrgPersonWithImage[]
  programs?: OrgProgram[]
  selectedProgramId?: string | null
}

// eslint-disable-next-line max-lines-per-function
export function OrgProfilePublicCard({
  profile,
  people,
  programs = [],
  selectedProgramId = null,
}: OrgProfilePublicCardProps) {
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
    ]
  )

  const staff = people.filter((p) => p.category === "staff")
  const governingBoard = people.filter((p) => p.category === "governing_board")
  const advisoryBoard = people.filter((p) => p.category === "advisory_board")
  const supporters = people.filter((p) => p.category === "supporters")
  const volunteers = people.filter((p) => p.category === "volunteers")
  const supporterRoster = [...supporters, ...volunteers]

  const hasPrograms = programs.length > 0
  const hasPeople =
    staff.length > 0 || governingBoard.length > 0 || advisoryBoard.length > 0
  const hasSupporters = supporterRoster.length > 0

  const description =
    typeof profile.description === "string"
      ? stripHtml(profile.description)
      : ""
  const mission =
    typeof profile.mission === "string" ? stripHtml(profile.mission) : ""
  const vision =
    typeof profile.vision === "string" ? stripHtml(profile.vision) : ""
  const need =
    typeof profile.need === "string" ? stripHtml(profile.need) : ""
  const values =
    typeof profile.values === "string" ? stripHtml(profile.values) : ""
  const originStory =
    typeof profile.originStory === "string" ? stripHtml(profile.originStory) : ""
  const theoryOfChange =
    typeof profile.theoryOfChange === "string"
      ? stripHtml(profile.theoryOfChange)
      : ""
  const boilerplate =
    typeof profile.boilerplate === "string"
      ? stripHtml(profile.boilerplate)
      : ""

  return (
    <Card className="bg-card/70 w-full overflow-hidden py-0 pb-10 shadow-xl shadow-black/10">
      <OrgProfilePublicHeader profile={profile} />

      <CardContent className="space-y-10 px-5 pt-0 sm:space-y-12 sm:px-10">
        <Separator />

        <OrgProfilePublicAboutSection
          description={description}
          originStory={originStory}
          need={need}
          mission={mission}
          vision={vision}
          values={values}
          theoryOfChange={theoryOfChange}
        />

        <Separator />

        <OrgProfilePublicDetailsSection
          profile={profile}
          addressLines={addressLines}
        />

        {hasPrograms ? (
          <OrgProfilePublicProgramsSection
            profileName={profile.name}
            programs={programs}
            selectedProgramId={selectedProgramId}
          />
        ) : null}

        {hasPeople || hasSupporters ? <Separator /> : null}

        <OrgProfilePublicPeopleSections
          people={people}
          staff={staff}
          governingBoard={governingBoard}
          advisoryBoard={advisoryBoard}
          supporterRoster={supporterRoster}
          showBoilerplateSeparator={boilerplate.trim().length > 0}
        />

        {boilerplate.trim().length > 0 ? (
          <FormRow
            title="Boilerplate"
            description="Shareable summary"
            inset={false}
          >
            <FieldText text={boilerplate} multiline />
          </FormRow>
        ) : null}
      </CardContent>
    </Card>
  )
}
