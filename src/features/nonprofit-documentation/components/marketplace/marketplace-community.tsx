import Link from "next/link"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import MapIcon from "lucide-react/dist/esm/icons/map"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"

import type { MarketplaceCommunityProfile } from "../../marketplace-types"

export function MarketplaceCommunity({
  profiles,
}: {
  profiles: MarketplaceCommunityProfile[]
}) {
  return (
    <section
      id="community"
      className="scroll-mt-8 border-t py-12"
      aria-labelledby="community-title"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-normal">
            Community
          </p>
          <h2
            id="community-title"
            className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-balance"
          >
            Organizations that chose to be public.
          </h2>
        </div>
        <div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            This preview contains only organizations already published on the
            Coach House Map. It excludes private profiles, contact details,
            exact addresses, coordinates, and unpublished programs.
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/">
              <MapIcon data-icon="inline-start" aria-hidden />
              Explore the Map
            </Link>
          </Button>
        </div>
      </div>

      {profiles.length > 0 ? (
        <div className="mt-8 grid border-t sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/find/${profile.slug}`}
              className="hover:bg-muted/40 focus-visible:bg-muted/40 group min-h-52 border-r border-b p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
            >
              <div className="flex items-start justify-between gap-4">
                <Building2Icon
                  className="text-muted-foreground size-5"
                  aria-hidden
                />
                <ArrowRightIcon
                  className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
              <h3 className="mt-5 font-semibold">{profile.name}</h3>
              <p className="text-muted-foreground mt-1 line-clamp-3 text-sm leading-5">
                {profile.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline">{profile.location}</Badge>
                <Badge variant="secondary">{profile.delivery}</Badge>
                {profile.programCount > 0 ? (
                  <Badge variant="secondary">
                    {profile.programCount}{" "}
                    {profile.programCount === 1 ? "program" : "programs"}
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          className="mt-8 min-h-64"
          icon={<Building2Icon className="size-5" aria-hidden />}
          title="No public organization preview is available"
          description="The Marketplace will not substitute private or unverified profiles. Use the Map to view currently published organizations."
          actions={
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/">Open the Map</Link>
            </Button>
          }
        />
      )}
    </section>
  )
}
