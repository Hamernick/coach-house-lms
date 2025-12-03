"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { PeopleShowcase, type OrgPersonWithImage } from "@/components/people/supporters-showcase"

type PeopleTabProps = {
  editMode: boolean
  people: OrgPersonWithImage[]
}

export function PeopleTab({ editMode, people }: PeopleTabProps) {
  const staff = people.filter((person) => person.category === "staff")
  const board = people.filter((person) => person.category === "board")
  const hasAny = staff.length > 0 || board.length > 0

  if (editMode) {
    return (
      <div className="grid gap-6">
        <FormRow title="People" description="Staff and board members.">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div />
              <Button asChild size="sm" variant="outline">
                <Link href="/people">Manage in People</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Staff</h4>
                <PeopleShowcase
                  people={staff}
                  allPeople={people}
                  emptyMessage={"No staff yet. Add team members from the People page."}
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Board</h4>
                <PeopleShowcase
                  people={board}
                  allPeople={people}
                  emptyMessage={"No board members yet. Add them from the People page."}
                />
              </div>
            </div>
          </div>
        </FormRow>
      </div>
    )
  }

  if (!hasAny) return null

  return (
    <div className="grid gap-6">
      <FormRow title="People">
        <div className="space-y-4">
          {staff.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Staff</h4>
              <PeopleShowcase people={staff} allPeople={people} emptyMessage={""} />
            </div>
          ) : null}
          {board.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Board</h4>
              <PeopleShowcase people={board} allPeople={people} emptyMessage={""} />
            </div>
          ) : null}
        </div>
      </FormRow>
    </div>
  )
}
