import Link from "next/link"

import type { CommunityOrganization } from "@/lib/queries/community"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Empty } from "@/components/ui/empty"

function getFallback(name: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function formatLocation(org: CommunityOrganization) {
  const parts = [org.city, org.state, org.country].filter((part) => part && part.trim().length > 0)
  return parts.join(", ")
}

export function CommunityOrganizationList({ organizations }: { organizations: CommunityOrganization[] }) {
  if (!organizations.length) {
    return (
      <Empty
        title="No public organizations yet"
        description="Once nonprofits publish their profiles you'll see them featured here."
        className="border bg-card/60"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {organizations.map((org, index) => (
        <div key={org.id} className="rounded-2xl border bg-card/70 p-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 border border-border/60">
              <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
              <AvatarFallback>{getFallback(org.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{org.name}</h3>
                {org.publicSlug ? (
                  <Link href={`/${org.publicSlug}`} className="text-xs font-medium text-primary underline underline-offset-4">
                    View profile
                  </Link>
                ) : null}
              </div>
              {org.tagline ? (
                <p className="truncate text-sm text-muted-foreground">{org.tagline}</p>
              ) : null}
              <p className="text-xs text-muted-foreground/80">{formatLocation(org) || "Location coming soon"}</p>
            </div>
            <div className="flex gap-2">
              {org.website ? (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="text-xs font-semibold">WWW</span>
                  <span className="sr-only">Website</span>
                </a>
              ) : null}
              {org.email ? (
                <a
                  href={`mailto:${org.email}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="text-xs font-semibold">@</span>
                  <span className="sr-only">Email</span>
                </a>
              ) : null}
            </div>
          </div>
          {index !== organizations.length - 1 ? <Separator className="mt-4" /> : null}
        </div>
      ))}
    </div>
  )
}
