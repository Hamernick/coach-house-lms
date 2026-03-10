import Image from "next/image"
import Link from "next/link"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"

import { ORG_HEADER_SQUARES } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { Button } from "@/components/ui/button"
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern/index"
import { ORG_BANNER_ASPECT_RATIO } from "@/lib/organization/banner-spec"
import { cn } from "@/lib/utils"

type AcceleratorOrgSnapshotHeaderCardProps = {
  titleText: string
  subtitleText: string | null
  descriptionText: string | null
  logoUrl?: string | null
  headerUrl?: string | null
  editHref: string
}

export function AcceleratorOrgSnapshotHeaderCard({
  titleText,
  subtitleText,
  descriptionText,
  logoUrl,
  headerUrl,
  editHref,
}: AcceleratorOrgSnapshotHeaderCardProps) {
  return (
    <div className="group border-border/60 bg-card flex h-full min-h-[252px] flex-col overflow-hidden rounded-[26px] border">
      <div
        className="bg-background relative mt-[5px] mr-[5px] mb-3 ml-[5px] w-full shrink-0 overflow-hidden rounded-[22px]"
        style={{ aspectRatio: ORG_BANNER_ASPECT_RATIO }}
      >
        {headerUrl ? (
          <Image
            src={headerUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, (max-width: 1600px) 960px, 1280px"
            className="object-cover object-center"
          />
        ) : null}
        {!headerUrl ? (
          <>
            <div className="from-background/5 via-background/10 to-background/40 absolute inset-0 bg-gradient-to-b" />
            <GridPattern
              patternId="accelerator-org-strip-header-pattern"
              squares={ORG_HEADER_SQUARES}
              className={cn(
                "inset-x-0 inset-y-[-45%] h-[200%] skew-y-12 [mask-image:radial-gradient(260px_circle_at_center,white,transparent)] opacity-70"
              )}
            />
          </>
        ) : null}
        <Button
          asChild
          size="icon"
          variant="secondary"
          className="bg-background/90 absolute top-3 right-3 z-10 h-8 w-8 rounded-full backdrop-blur-sm"
        >
          <Link href={editHref} aria-label="Edit organization">
            <PencilIcon className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="relative min-h-[122px] space-y-1 px-4 pt-0 pb-5">
        <div className="border-border/70 bg-background absolute top-[-28px] left-4 h-12 w-12 overflow-hidden rounded-lg border">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="text-muted-foreground grid h-full w-full place-items-center text-[10px] font-semibold tracking-wide">
              LOGO
            </span>
          )}
        </div>
        <div className="space-y-0.5 pt-[2.8rem]">
          {titleText ? (
            <p className="text-foreground truncate text-base leading-tight font-semibold">
              {titleText}
            </p>
          ) : null}
          {subtitleText ? (
            <p className="text-muted-foreground line-clamp-2 text-xs leading-tight">
              {subtitleText}
            </p>
          ) : null}
          {descriptionText ? (
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-xs font-medium">About</p>
              <p className="text-muted-foreground/90 line-clamp-3 text-xs leading-tight">
                {descriptionText}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
