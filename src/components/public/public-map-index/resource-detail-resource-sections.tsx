import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import PhoneIcon from "lucide-react/dist/esm/icons/phone"

import { Button } from "@/components/ui/button"
import { shouldShowPublicMapResourceLink } from "@/lib/public-map/resource-link-visibility"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import {
  formatResourceList,
  formatResourceVerifiedDate,
  isExternalHttpHref,
  normalizeResourceHref,
  PUBLIC_MAP_RESOURCE_CONTACT_TYPE_LABELS,
  PUBLIC_MAP_RESOURCE_DELIVERY_MODE_LABELS,
  PUBLIC_MAP_RESOURCE_LINK_TYPE_LABELS,
} from "./resource-detail-helpers"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME,
} from "./sidebar-theme"

function rankPublicMapResourceLink(
  link: NonNullable<ExternalResourceMapItem["links"]>[number]
) {
  if (link.type === "website") return 0
  if (link.isPrimary) return 1
  return 2
}

export function PublicMapResourceLinksSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const links = (item.links ?? [])
    .flatMap((link) => {
      const href = normalizeResourceHref(link.url)
      if (!href) return []
      return [{ ...link, href }]
    })
    .filter(shouldShowPublicMapResourceLink)
    .sort(
      (first, second) =>
        rankPublicMapResourceLink(first) - rankPublicMapResourceLink(second)
    )

  if (links.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Links</p>
      <div className="mt-2 grid gap-1.5">
        {links.map((link) => {
          const external = isExternalHttpHref(link.href)

          return (
            <a
              key={link.id}
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className={cn(
                "flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs",
                PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{link.label}</span>
                <span className="text-muted-foreground block truncate">
                  {link.domain ??
                    PUBLIC_MAP_RESOURCE_LINK_TYPE_LABELS[link.type]}
                </span>
              </span>
              <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
          )
        })}
      </div>
    </section>
  )
}

export function PublicMapResourceContactSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const contacts = item.contacts ?? []
  if (contacts.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Contact</p>
      <div className="mt-2 grid gap-1.5">
        {contacts.map((contact) => {
          const href = normalizeResourceHref(contact.url)
          const content = (
            <>
              <PhoneIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {contact.value}
                </span>
                <span className="text-muted-foreground block truncate text-[11px]">
                  {contact.label ??
                    PUBLIC_MAP_RESOURCE_CONTACT_TYPE_LABELS[contact.type]}
                </span>
              </span>
            </>
          )

          if (!href) {
            return (
              <div
                key={contact.id}
                className="border-border/55 bg-muted/20 flex min-h-11 min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs"
              >
                {content}
              </div>
            )
          }

          return (
            <a
              key={contact.id}
              href={href}
              className={cn(
                "flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-xs",
                PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
              )}
            >
              {content}
            </a>
          )
        })}
      </div>
    </section>
  )
}

export function PublicMapResourceAccessSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const deliveryModes = formatResourceList(
    (item.deliveryModes ?? []).map(
      (mode) => PUBLIC_MAP_RESOURCE_DELIVERY_MODE_LABELS[mode]
    )
  )
  const rows = [
    { label: "Access", value: deliveryModes },
    { label: "Status", value: item.availability?.statusLabel },
    { label: "Hours", value: item.hoursLabel },
    { label: "Availability", value: item.availability?.notes },
    { label: "Updated", value: formatResourceVerifiedDate(item.lastUpdatedAt) },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

  if (rows.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Access</p>
      <dl className="mt-2 grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd className="text-foreground min-w-0 text-xs font-medium break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function PublicMapResourceServicesSection({
  item,
}: {
  item: ExternalResourceMapItem
}) {
  const services = item.services ?? []
  if (services.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Services</p>
      <div className="divide-border/55 mt-2 divide-y">
        {services.map((service) => {
          const intakeHref = normalizeResourceHref(service.intakeUrl)
          const serviceRows = [
            { label: "Helps", value: service.whoItHelps },
            { label: "Eligibility", value: service.eligibility },
            { label: "Cost", value: service.cost },
            {
              label: "Languages",
              value: formatResourceList(service.languages),
            },
            { label: "Appointment", value: service.appointmentInfo },
            {
              label: "Documents",
              value: formatResourceList(service.documentsNeeded),
            },
            { label: "Access", value: service.accessibilityNotes },
            { label: "Urgent", value: service.urgentAvailability },
            { label: "Age", value: service.ageRange },
            { label: "Area", value: formatResourceList(service.serviceArea) },
          ].filter((row): row is { label: string; value: string } =>
            Boolean(row.value)
          )

          return (
            <div key={service.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{service.title}</p>
                  {service.description ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                {intakeHref ? (
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      "h-8 shrink-0 rounded-full px-2.5 text-[11px]",
                      PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
                    )}
                  >
                    <a
                      href={intakeHref}
                      target={
                        isExternalHttpHref(intakeHref) ? "_blank" : undefined
                      }
                      rel={
                        isExternalHttpHref(intakeHref)
                          ? "noreferrer"
                          : undefined
                      }
                    >
                      Intake
                    </a>
                  </Button>
                ) : null}
              </div>
              {serviceRows.length > 0 ? (
                <dl className="mt-2 grid gap-1.5">
                  {serviceRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[5rem_1fr] gap-2"
                    >
                      <dt className="text-muted-foreground text-[11px]">
                        {row.label}
                      </dt>
                      <dd className="text-foreground min-w-0 text-[11px] font-medium break-words">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
