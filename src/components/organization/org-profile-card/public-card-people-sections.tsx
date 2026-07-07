import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import {
  PeopleShowcase,
  SupportersShowcase,
} from "@/components/people/supporters-showcase"
import { Separator } from "@/components/ui/separator"

import { FormRow } from "./shared"

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
            layout="stacked"
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
            layout="stacked"
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
            layout="stacked"
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
            layout="stacked"
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
