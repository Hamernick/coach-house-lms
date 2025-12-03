"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { SupportersShowcase, type OrgPersonWithImage } from "@/components/people/supporters-showcase"

type SupportersTabProps = {
  editMode: boolean
  people: OrgPersonWithImage[]
}

export function SupportersTab({ editMode, people }: SupportersTabProps) {
  const supporters = people.filter((person) => person.category === "supporter")

  if (editMode) {
    return (
      <div className="grid gap-6">
        <FormRow title="Supporters">
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
            {supporters.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Updates to supporters on the People page are reflected here automatically.
              </p>
            ) : null}
          </div>
        </FormRow>
      </div>
    )
  }

  if (supporters.length === 0) return null

  return (
    <div className="grid gap-6">
      <FormRow title="Supporters">
        <SupportersShowcase supporters={supporters} allPeople={people} emptyMessage={""} />
      </FormRow>
    </div>
  )
}
