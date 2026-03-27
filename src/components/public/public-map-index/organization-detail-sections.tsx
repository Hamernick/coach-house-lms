"use client"

import DownloadIcon from "lucide-react/dist/esm/icons/download"

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

import {
  truncateAtWordBoundary,
  type OrganizationDetailContactRow,
  type OrganizationDetailStoryField,
} from "./organization-detail-helpers"

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
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Brand kit</p>
        {brandKitDownloadHref ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 rounded-md border border-border/70 bg-background/80 px-2 text-[11px] text-foreground hover:bg-muted"
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
            logoCards.length > 1 ? "grid-cols-2" : "grid-cols-1",
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
    <div className="rounded-xl border border-border/70 bg-background/80 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-2 flex h-16 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    </div>
  )
}

export function OrganizationDetailOriginSection({
  storyFields,
  expandedStoryFields,
  onToggleField,
}: DetailOriginProps) {
  return (
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <p className="text-sm font-medium">Origin</p>
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
              <AccordionTrigger className="py-2 text-sm font-medium text-muted-foreground hover:no-underline">
                {field.label}
              </AccordionTrigger>
              <AccordionContent>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {copy}
                  {needsToggle ? (
                    <>
                      {" "}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto px-0 py-0 text-sm text-primary"
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
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <p className="text-sm font-medium">Contact</p>
      {contactRows.length > 0 ? (
        <div className="mt-1.5 space-y-1.5">
          {contactRows.map((row) => (
            <p key={row.label} className="text-xs text-foreground">
              <span className="font-medium text-muted-foreground">
                {row.label}:
              </span>{" "}
              {row.value}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
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
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <p className="text-sm font-medium">Address</p>
      {isOnlineOnly ? (
        <div className="mt-1.5 space-y-2">
          {resourceHref && webAddress ? (
            <a
              href={resourceHref}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-xs text-foreground underline-offset-4 hover:underline"
            >
              {webAddress}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">
              No web address listed yet.
            </p>
          )}
        </div>
      ) : addressLines.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {addressLines.map((line) => (
            <li key={line} className="text-xs text-foreground">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          No address listed yet. This profile can still appear on `/find`, but it
          will not render a map marker until an address is added.
        </p>
      )}
    </section>
  )
}

export function OrganizationDetailProgramsSection({
  programs,
}: {
  programs: PublicMapOrganization["programs"]
}) {
  if (programs.length === 0) return null

  return (
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <p className="text-sm font-medium">Featured Programs</p>
      <div className="mt-1.5 space-y-1.5">
        {programs.map((program) => (
          <article
            key={program.id}
            className="rounded-lg border border-border/70 bg-card/80 px-2 py-1.5"
          >
            {program.imageUrl ? (
              <div className="mb-1.5 h-24 overflow-hidden rounded-md border border-border/70 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={program.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <p className="line-clamp-1 text-xs font-medium text-foreground">
              {program.title}
            </p>
            {program.subtitle ? (
              <p className="line-clamp-2 text-[11px] text-muted-foreground">
                {program.subtitle}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
