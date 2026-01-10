"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { PeopleShowcase, type OrgPersonWithImage } from "@/components/people/supporters-showcase"
import UsersIcon from "lucide-react/dist/esm/icons/users"

type PeopleTabProps = {
  editMode: boolean
  people: OrgPersonWithImage[]
}

export function PeopleTab({ editMode, people }: PeopleTabProps) {
  const staff = people.filter((person) => person.category === "staff")
  const governingBoard = people.filter((person) => person.category === "governing_board")
  const advisoryBoard = people.filter((person) => person.category === "advisory_board")
  const hasAny = staff.length > 0 || governingBoard.length > 0 || advisoryBoard.length > 0

  if (editMode) {
    return (
      <div className="grid gap-6">
        <FormRow title="People" description="Staff, governing board, and advisory board members.">
          {!hasAny ? (
            <Empty
              icon={<UsersIcon className="h-5 w-5" />}
              title="No people yet"
              description="Add staff and board members from the People page."
              actions={
                <Button asChild size="sm" variant="outline">
                  <Link href="/people">Manage in People</Link>
                </Button>
              }
            />
          ) : (
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
                  <h4 className="text-sm font-medium text-muted-foreground">Governing board</h4>
                  <PeopleShowcase
                    people={governingBoard}
                    allPeople={people}
                    emptyMessage={"No governing board members yet. Add them from the People page."}
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Advisory board</h4>
                  <PeopleShowcase
                    people={advisoryBoard}
                    allPeople={people}
                    emptyMessage={"No advisory board members yet. Add them from the People page."}
                  />
                </div>
              </div>
            </div>
          )}
        </FormRow>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <FormRow title="People">
        {!hasAny ? (
            <Empty
              icon={<UsersIcon className="h-5 w-5" />}
              title="No people to display"
              description="Staff and board members will show up here once they are added."
            />
        ) : (
          <div className="space-y-4">
            {staff.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Staff</h4>
                <PeopleShowcase people={staff} allPeople={people} emptyMessage={""} />
              </div>
            ) : null}
            {governingBoard.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Governing board</h4>
                <PeopleShowcase people={governingBoard} allPeople={people} emptyMessage={""} />
              </div>
            ) : null}
            {advisoryBoard.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Advisory board</h4>
                <PeopleShowcase people={advisoryBoard} allPeople={people} emptyMessage={""} />
              </div>
            ) : null}
          </div>
        )}
      </FormRow>
    </div>
  )
}
