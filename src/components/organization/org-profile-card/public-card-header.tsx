import Image from "next/image"
import Link from "next/link"

import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { ORG_BANNER_ASPECT_RATIO } from "@/lib/organization/banner-spec"
import { cn } from "@/lib/utils"

import {
  PUBLIC_CARD_HEADER_SQUARES,
  PUBLIC_CARD_SOCIAL_FIELDS,
} from "./public-card-sections-config"
import { hasPublicProfileValue } from "./public-card-section-utils"
import type { OrgProfile } from "./types"

function createIcon(slug: keyof typeof PROVIDER_ICON) {
  const Icon = PROVIDER_ICON[slug] ?? PROVIDER_ICON.generic
  return <Icon className="h-4 w-4" />
}

export function OrgProfilePublicHeader({
  profile,
}: {
  profile: OrgProfile
}) {
  const hasHeaderImage = hasPublicProfileValue(profile.headerUrl)

  return (
    <>
      <div
        className="bg-background relative w-full overflow-hidden border-b"
        style={{ aspectRatio: ORG_BANNER_ASPECT_RATIO }}
      >
        {hasHeaderImage ? (
          <Image
            src={profile.headerUrl as string}
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 1024px"
            loading="eager"
          />
        ) : null}
        {!hasHeaderImage ? (
          <>
            <div className="from-background/5 via-background/10 to-background/40 absolute inset-0 bg-gradient-to-b" />
            <GridPattern
              patternId="org-public-header-pattern"
              squares={PUBLIC_CARD_HEADER_SQUARES}
              className={cn(
                "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 [mask-image:radial-gradient(320px_circle_at_center,white,transparent)] opacity-70"
              )}
            />
          </>
        ) : null}
      </div>

      <div className="relative p-5 sm:px-10 sm:pb-10">
        <div className="absolute -top-10 left-4 flex items-center gap-3 sm:-top-12 sm:left-10">
          <div className="border-border bg-background relative h-20 w-20 overflow-hidden rounded-xl border shadow-sm sm:h-24 sm:w-24">
            {hasPublicProfileValue(profile.logoUrl) ? (
              <Image
                src={profile.logoUrl as string}
                alt={profile.name ?? "Organization"}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="text-muted-foreground grid h-full w-full place-items-center text-sm">
                LOGO
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:mt-14">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.name || "Organization"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {profile.tagline && profile.tagline.trim() ? profile.tagline : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasPublicProfileValue(profile.publicUrl) ? (
              <Link
                href={profile.publicUrl as string}
                target="_blank"
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("link")}
                <span className="sr-only">Website</span>
              </Link>
            ) : null}
            {hasPublicProfileValue(profile.newsletter) ? (
              <Link
                href={profile.newsletter as string}
                target="_blank"
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("link")}
                <span className="sr-only">Newsletter</span>
              </Link>
            ) : null}
            {hasPublicProfileValue(profile.email) ? (
              <Link
                href={`mailto:${profile.email}`}
                className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
              >
                {createIcon("email")}
                <span className="sr-only">Email</span>
              </Link>
            ) : null}
            {PUBLIC_CARD_SOCIAL_FIELDS.map(({ key, icon }) =>
              hasPublicProfileValue(profile[key]) ? (
                <Link
                  key={key}
                  href={profile[key] as string}
                  target="_blank"
                  className="border-border/60 bg-card/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9"
                >
                  {createIcon(icon)}
                  <span className="sr-only">{key}</span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      </div>
    </>
  )
}
