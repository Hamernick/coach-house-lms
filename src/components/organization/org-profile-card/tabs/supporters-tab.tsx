"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { SupportersShowcase, type OrgPersonWithImage } from "@/components/people/supporters-showcase"
import HeartHandshakeIcon from "lucide-react/dist/esm/icons/heart-handshake"

type SupportersTabProps = {
  editMode: boolean
  people: OrgPersonWithImage[]
}

export function SupportersTab({ editMode, people }: SupportersTabProps) {
  const supporters = people.filter((person) => person.category === "supporters")
  const volunteers = people.filter((person) => person.category === "volunteers")

  if (editMode) {
    return (
      <div className="grid gap-6">
        <FormRow title="Supporters" description="Foundations, corporate partners, and other backers.">
          {supporters.length === 0 ? (
            <Empty
              icon={<HeartHandshakeIcon className="h-5 w-5" />}
              title="No supporters yet"
              description="Add supporters from the People page."
              actions={
                <Button asChild size="sm" variant="outline">
                  <Link href="/people">Manage in People</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div />
                <Button asChild size="sm" variant="outline">
                  <Link href="/people">Manage in People</Link>
                </Button>
              </div>
              <SupportersShowcase
                supporters={supporters}
                allPeople={people}
                emptyMessage={"No supporters yet. Add supporters from the People page."}
              />
            </div>
          )}
        </FormRow>
        <FormRow title="Volunteers">
          {volunteers.length === 0 ? (
            <Empty
              icon={<HeartHandshakeIcon className="h-5 w-5" />}
              title="No volunteers yet"
              description="Add volunteers from the People page."
              actions={
                <Button asChild size="sm" variant="outline">
                  <Link href="/people">Manage in People</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div />
                <Button asChild size="sm" variant="outline">
                  <Link href="/people">Manage in People</Link>
                </Button>
              </div>
              <SupportersShowcase
                supporters={volunteers}
                allPeople={people}
                emptyMessage={"No volunteers yet. Add volunteers from the People page."}
              />
            </div>
          )}
        </FormRow>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <FormRow title="Supporters" description="Foundations, corporate partners, and other backers.">
        {supporters.length === 0 ? (
          <Empty
            icon={<HeartHandshakeIcon className="h-5 w-5" />}
            title="No supporters to display"
            description="Supporters will appear here once they are added."
          />
        ) : (
          <SupportersShowcase supporters={supporters} allPeople={people} emptyMessage={""} />
        )}
      </FormRow>
      <FormRow title="Volunteers">
        {volunteers.length === 0 ? (
          <Empty
            icon={<HeartHandshakeIcon className="h-5 w-5" />}
            title="No volunteers to display"
            description="Volunteers will appear here once they are added."
          />
        ) : (
          <SupportersShowcase supporters={volunteers} allPeople={people} emptyMessage={""} />
        )}
      </FormRow>
    </div>
  )
}
