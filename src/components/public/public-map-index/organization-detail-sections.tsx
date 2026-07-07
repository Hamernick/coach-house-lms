"use client"

import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { OrganizationFormationStatusSummary } from "@/components/organization/organization-formation-status-summary"
import type { FormationStatusOption } from "@/lib/organization/formation-status"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

import { PublicMapMediaImage } from "./media-image"
import {
  truncateAtWordBoundary,
  type OrganizationDetailContactRow,
  type OrganizationDetailStoryField,
} from "./organization-detail-helpers"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_MEDIA_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME,
} from "./sidebar-theme"

type DetailBrandKitProps = {
  organization: PublicMapOrganization
  brandKitDownloadHref: string | null
}

type DetailOriginProps = {
  storyFields: OrganizationDetailStoryField[]
  expandedStoryFields: Record<string, boolean>
  onToggleField: (fieldLabel: string) => void
}

export function OrganizationDetailBrandKitSection({
  organization,
  brandKitDownloadHref,
}: DetailBrandKitProps) {
  const logoCards = [
    {
      key: "primary-logo",
      label: "Primary logo",
      imageUrl: organization.logoUrl,
      alt: `${organization.name} primary logo`,
    },
    {
      key: "logo-mark",
      label: "Logo mark",
      imageUrl: organization.brandMarkUrl,
      alt: `${organization.name} logo mark`,
    },
  ].filter((card) => Boolean(card.imageUrl))

  if (!brandKitDownloadHref && logoCards.length === 0) return null

  return (
    <section className="p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Brand kit</p>
        {brandKitDownloadHref ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 rounded-md px-2 text-[11px]",
              PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
            )}
          >
            <a href={brandKitDownloadHref} target="_blank" rel="noreferrer">
              <DownloadIcon className="h-3.5 w-3.5" aria-hidden />
              Download
            </a>
          </Button>
        ) : null}
      </div>

      {logoCards.length > 0 ? (
        <div
          className={cn(
            "mt-2 grid gap-2",
            logoCards.length > 1 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {logoCards.map((card) => (
            <OrganizationDetailLogoCard
              key={card.key}
              label={card.label}
              imageUrl={card.imageUrl!}
              alt={card.alt}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function OrganizationDetailLogoCard({
  label,
  imageUrl,
  alt,
}: {
  label: string
  imageUrl: string
  alt: string
}) {
  return (
    <div className={cn("p-2", PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME)}>
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <PublicMapMediaImage
        src={imageUrl}
        alt={alt}
        wrapperClassName={cn(
          "mt-2 flex h-16 items-center justify-center rounded-xl p-2",
          PUBLIC_MAP_SIDEBAR_MEDIA_SURFACE_CLASSNAME
        )}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </div>
  )
}

export function OrganizationDetailOriginSection({
  storyFields,
  expandedStoryFields,
  onToggleField,
}: DetailOriginProps) {
  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">About</p>
      <Accordion type="single" collapsible className="mt-1 w-full">
        {storyFields.map((field) => {
          const hasCopy = field.value.length > 0
          const expanded = Boolean(expandedStoryFields[field.label])
          const needsToggle = hasCopy && field.value.length > 260
          const copy = hasCopy
            ? expanded
              ? field.value
              : truncateAtWordBoundary(field.value, 260)
            : "Not provided yet."

          return (
            <AccordionItem
              key={field.label}
              value={field.label}
              className="border-border/60"
            >
              <AccordionTrigger className="text-muted-foreground py-2 text-sm font-medium hover:no-underline">
                {field.label}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {copy}
                  {needsToggle ? (
                    <>
                      {" "}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-primary h-auto px-0 py-0 text-sm"
                        onClick={() => onToggleField(field.label)}
                      >
                        {expanded ? "View less" : "View more"}
                      </Button>
                    </>
                  ) : null}
                </p>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}

export function OrganizationDetailContactSection({
  contactRows,
}: {
  contactRows: OrganizationDetailContactRow[]
}) {
  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Contact</p>
      {contactRows.length > 0 ? (
        <div className="mt-1.5 space-y-1.5">
          {contactRows.map((row) => (
            <p key={row.label} className="text-foreground text-xs">
              <span className="text-muted-foreground font-medium">
                {row.label}:
              </span>{" "}
              {row.value}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-1 text-xs">
          No contact details listed.
        </p>
      )}
    </section>
  )
}

export function OrganizationDetailFormationSection({
  formationStatus,
}: {
  formationStatus: FormationStatusOption | null
}) {
  if (!formationStatus) return null

  return (
    <div className="mr-auto w-full max-w-[22.5rem] space-y-1.5">
      <p className="text-sm font-medium">Formation status</p>
      <OrganizationFormationStatusSummary formationStatus={formationStatus} />
    </div>
  )
}

export function OrganizationDetailAddressSection({
  addressLines,
  isOnlineOnly,
  resourceHref,
}: {
  addressLines: string[]
  isOnlineOnly: boolean
  resourceHref: string | null
}) {
  const webAddress = resourceHref
    ? resourceHref.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Address</p>
      {isOnlineOnly ? (
        <div className="mt-1.5 space-y-2">
          {resourceHref && webAddress ? (
            <a
              href={resourceHref}
              target="_blank"
              rel="noreferrer"
              className="text-foreground block text-xs break-all underline-offset-4 hover:underline"
            >
              {webAddress}
            </a>
          ) : (
            <p className="text-muted-foreground text-xs">
              No web address listed yet.
            </p>
          )}
        </div>
      ) : addressLines.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {addressLines.map((line) => (
            <li key={line} className="text-foreground text-xs">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-1 text-xs">
          No address listed yet. This profile can still appear on `/find`, but
          it will not render a map marker until an address is added.
        </p>
      )}
    </section>
  )
}

export function OrganizationDetailActivitiesSection({
  activities,
}: {
  activities: PublicMapOrganization["activityLinks"]
}) {
  if (activities.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Activity</p>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {activities.length}
        </span>
      </div>
      <div className="mt-1.5 space-y-1.5">
        {activities.map((activity) => (
          <article
            key={activity.id}
            className={cn(
              "rounded-lg px-2 py-1.5",
              PUBLIC_MAP_SIDEBAR_SECTION_ALT_CLASSNAME
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-foreground line-clamp-1 text-xs font-medium">
                  {activity.title}
                </p>
                {activity.description || activity.subtitle ? (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px]">
                    {activity.description || activity.subtitle}
                  </p>
                ) : null}
              </div>
              {activity.ctaUrl || activity.locationUrl ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-7 w-7 shrink-0 rounded-full",
                    PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
                  )}
                >
                  <a
                    href={activity.ctaUrl || activity.locationUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${activity.title}`}
                  >
                    <ExternalLinkIcon className="size-3.5" aria-hidden />
                  </a>
                </Button>
              ) : null}
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1">
              {[activity.activityKind, activity.durationLabel]
                .filter((value): value is string => Boolean(value))
                .slice(0, 2)
                .map((chip) => (
                  <span
                    key={chip}
                    className="bg-muted text-muted-foreground inline-flex h-5 max-w-full items-center rounded-full px-1.5 text-[10px] leading-none"
                  >
                    <span className="truncate">{chip}</span>
                  </span>
                ))}
              {activity.locationType ? (
                <span className="text-muted-foreground inline-flex h-5 items-center gap-1 text-[10px] leading-none">
                  <MapPinIcon className="size-3" aria-hidden />
                  {activity.locationType === "online" ? "Online" : "In person"}
                </span>
              ) : null}
            </div>
            {activity.chips.length > 2 ? (
              <p className="text-muted-foreground/80 mt-1 line-clamp-1 text-[10px]">
                {activity.chips.slice(2, 5).join(" · ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
