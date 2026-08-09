import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

export type PublicMapResourceLinkKind = "online_resource" | "location"

export type PublicMapOrganizationResourceLink = {
  key: string
  label: string
  href: string
  domain: string
  kind: PublicMapResourceLinkKind
  kindLabel: string
  note: string
}

export function normalizePublicMapResourceLinkHref(
  value: string | null | undefined
) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function formatPublicMapResourceLinkDomain(href: string) {
  try {
    const url = new URL(href)
    return url.hostname.replace(/^www\./i, "")
  } catch {
    return href.replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
  }
}

function normalizePublicMapResourceLinkIdentity(href: string) {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./i, "").toLowerCase()
    const pathname = url.pathname.replace(/\/$/, "")
    return `${url.protocol.toLowerCase()}//${host}${pathname}${url.search}`
  } catch {
    return href
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/www\./, "https://")
      .replace(/\/$/, "")
  }
}

function resolvePublicMapResourceLinkKindLabel(
  kind: PublicMapResourceLinkKind
) {
  if (kind === "location") return "Location"
  return "Web resource"
}

export function buildPublicMapResourceLinks(
  organization: PublicMapOrganization
): PublicMapOrganizationResourceLink[] {
  const activityLinks =
    organization.activityLinks.length > 0
      ? organization.activityLinks
      : organization.programs
  const candidates: Array<{
    key: string
    label: string
    href: string | null
    kind: PublicMapResourceLinkKind
    kindLabel: string
    note: string
  }> = [
    ...activityLinks.flatMap((program) => {
      const ctaHref = normalizePublicMapResourceLinkHref(program.ctaUrl)
      const locationHref = normalizePublicMapResourceLinkHref(
        program.locationUrl
      )
      const activityNote = `${program.activityKind}${program.durationLabel ? ` · ${program.durationLabel}` : ""}`
      const links: Array<{
        key: string
        label: string
        href: string | null
        kind: PublicMapResourceLinkKind
        kindLabel: string
        note: string
      }> = []

      if (ctaHref) {
        links.push({
          key: `activity:${program.id}:cta`,
          label: program.ctaLabel?.trim() || program.title,
          href: ctaHref,
          kind: "online_resource",
          kindLabel: resolvePublicMapResourceLinkKindLabel("online_resource"),
          note: activityNote,
        })
      }

      if (locationHref) {
        const kind =
          program.locationType === "online" ? "online_resource" : "location"
        links.push({
          key: `activity:${program.id}:location`,
          label:
            program.activityKind === "Web resource"
              ? program.title
              : `${program.title} location`,
          href: locationHref,
          kind,
          kindLabel: resolvePublicMapResourceLinkKindLabel(kind),
          note: activityNote,
        })
      }

      return links
    }),
  ]

  const seen = new Set<string>()
  return candidates.flatMap((candidate) => {
    if (!candidate.href) return []
    const normalized = normalizePublicMapResourceLinkIdentity(candidate.href)
    if (seen.has(normalized)) return []
    seen.add(normalized)

    return [
      {
        key: candidate.key,
        label: candidate.label,
        href: candidate.href,
        domain: formatPublicMapResourceLinkDomain(candidate.href),
        kind: candidate.kind,
        kindLabel: candidate.kindLabel,
        note: candidate.note,
      } satisfies PublicMapOrganizationResourceLink,
    ]
  })
}

export function buildPublicMapResourceLinkSearchText(
  resources: PublicMapOrganizationResourceLink[]
) {
  return resources
    .flatMap((resource) => [
      resource.label,
      resource.domain,
      resource.kindLabel,
      resource.note,
    ])
    .join(" ")
}
