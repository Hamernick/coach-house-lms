"use client"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"

import { PersonItem } from "@/components/people/person-item"
import { cn } from "@/lib/utils"

export type OrgPersonWithImage = OrgPerson & { displayImage?: string | null }

interface PeopleShowcaseProps {
  people: OrgPersonWithImage[]
  allPeople?: OrgPersonWithImage[]
  emptyMessage?: string
  className?: string
}

export function PeopleShowcase({
  people,
  allPeople,
  emptyMessage = "No people yet.",
  className,
}: PeopleShowcaseProps) {
  if (!people || people.length === 0) {
    return (
      <p className={cn("rounded-md border border-dashed p-4 text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    )
  }

  const collection = allPeople ?? people

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {people.map((person) => (
        <PersonItem key={person.id} person={person} allPeople={collection} />
      ))}
    </div>
  )
}

interface SupportersShowcaseProps extends Omit<PeopleShowcaseProps, "people"> {
  supporters: OrgPersonWithImage[]
}

export function SupportersShowcase({ supporters, ...rest }: SupportersShowcaseProps) {
  return <PeopleShowcase people={supporters} {...rest} />
}
