import Link from "next/link"

import UsersIcon from "lucide-react/dist/esm/icons/users"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

type MyOrganizationTeamCardProps = {
  people: OrgPersonWithImage[]
  className?: string
}

export function MyOrganizationTeamCard({ people, className }: MyOrganizationTeamCardProps) {
  return (
    <Card data-bento-card="team" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersIcon className="h-4 w-4" aria-hidden />
          Team
        </CardTitle>
        <CardDescription>People currently listed on your profile.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {people.length > 0 ? (
          <ul className="max-h-56 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border/60 bg-background/20">
            {people.slice(0, 4).map((person, index) => (
              <li key={`${person.name}-${index}`} className="px-3 py-2.5">
                <p className="truncate text-sm font-medium">{person.name || "Unnamed teammate"}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {person.title || person.category || "Role pending"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
            Add teammates to power your org chart and board transparency.
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto pt-0">
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href="/people">Manage people</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
