"use client"

import { Fragment } from "react"
import type { OrgPerson } from "@/app/(dashboard)/people/actions"

import { PersonItem } from "@/components/people/person-item"
import { cn } from "@/lib/utils"
import { ItemGroup, ItemSeparator } from "@/components/ui/item-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PERSON_CATEGORY_META } from "@/lib/people/categories"

export type OrgPersonWithImage = OrgPerson & { displayImage?: string | null }

type PeopleShowcaseVariant = "default" | "public"

interface PeopleShowcaseProps {
  people: OrgPersonWithImage[]
  allPeople?: OrgPersonWithImage[]
  emptyMessage?: string
  className?: string
  variant?: PeopleShowcaseVariant
}

const CATEGORY_STRIP: Record<OrgPerson["category"], string> = Object.fromEntries(
  Object.entries(PERSON_CATEGORY_META).map(([key, value]) => [key, value.stripClass]),
) as Record<OrgPerson["category"], string>

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function PeopleShowcase({
  people,
  allPeople,
  emptyMessage = "No people yet.",
  className,
  variant = "default",
}: PeopleShowcaseProps) {
  if (!people || people.length === 0) {
    return (
      <p className={cn("rounded-md border border-dashed p-4 text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    )
  }

  if (variant === "public") {
    return (
      <ItemGroup className={cn("w-full gap-4", className)}>
        {people.map((person, index) => {
          const isSupporter = person.category === "supporters"
          return (
            <Fragment key={person.id}>
              <div className="relative flex items-center gap-3.5 px-4 py-0.5 sm:px-6">
                <Avatar className={cn("size-10", isSupporter && "rounded-xl bg-muted/60 ring-1 ring-border/60")}>
                  <AvatarImage
                    src={person.displayImage ?? person.image ?? undefined}
                    alt={person.name ?? "Person"}
                    className={cn(isSupporter && "object-contain p-1.5")}
                  />
                  <AvatarFallback className={cn(isSupporter && "rounded-xl")}>
                    {initials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
                  {person.title ? <p className="truncate text-xs text-muted-foreground">{person.title}</p> : null}
                </div>
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full",
                    CATEGORY_STRIP[person.category],
                  )}
                  aria-hidden="true"
                />
              </div>
              {index !== people.length - 1 ? <ItemSeparator className="my-1 w-full" /> : null}
            </Fragment>
          )
        })}
      </ItemGroup>
    )
  }

  const collection = allPeople ?? people

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
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
