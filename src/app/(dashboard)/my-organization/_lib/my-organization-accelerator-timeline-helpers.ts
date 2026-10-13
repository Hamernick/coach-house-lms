import type {
  WorkspaceAcceleratorCardStepResource,
} from "@/features/workspace-accelerator-card"
import type { ModuleCard } from "@/lib/accelerator/progress"
import type { ModuleRecord } from "@/lib/modules"

const ORGANIZATION_SETUP_MODULE_ID = "workspace-onboarding-organization-setup"
const ORGANIZATION_SETUP_TITLE_SIGNALS = new Set([
  "organization setup",
  "workspace setup",
])
const ORGANIZATION_SETUP_SLUG_SIGNALS = [
  "organization-setup",
  "workspace-setup",
  "onboarding-organization-setup",
] as const
const COMMUNITY_RESOURCE_LINKS: WorkspaceAcceleratorCardStepResource[] = [
  {
    id: "community-whatsapp",
    title: "WhatsApp community",
    url: "https://chat.whatsapp.com/LSLZR3IKS9lAbWDR3uPNLN",
    kind: "community",
  },
  {
    id: "community-discord",
    title: "Discord community",
    url: "https://discord.gg/kDtqKspG",
    kind: "community",
  },
  {
    id: "community-find",
    title: "Find organizations",
    url: "/find",
    kind: "resource",
  },
]
const FORMATION_RESOURCE_LINKS: Record<
  string,
  WorkspaceAcceleratorCardStepResource[]
> = {
  "nfp-registration": [
    {
      id: "formation-bizee-ein",
      title: "Bizee EIN registration support",
      url: "https://bizee.com",
      kind: "resource",
    },
  ],
  "filing-1023": [
    {
      id: "formation-irs-1023",
      title: "IRS Form 1023 application",
      url: "https://www.irs.gov/uac/about-form-1023",
      kind: "resource",
    },
    {
      id: "formation-irs-1023-ez",
      title: "IRS Form 1023-EZ application",
      url: "https://www.irs.gov/forms-pubs/about-form-1023-ez",
      kind: "resource",
    },
  ],
}

function normalizeOrganizationSetupToken(value: string | null | undefined) {
  if (typeof value !== "string") return ""
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hasOrganizationSetupSlugSignal(value: string | null | undefined) {
  if (typeof value !== "string") return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return ORGANIZATION_SETUP_SLUG_SIGNALS.some((signal) => normalized.includes(signal))
}

function hasOrganizationSetupTitleSignal(value: string | null | undefined) {
  const normalized = normalizeOrganizationSetupToken(value)
  if (!normalized) return false
  return ORGANIZATION_SETUP_TITLE_SIGNALS.has(normalized)
}

function normalizeModuleResourceToken(value: string | null | undefined) {
  if (typeof value !== "string") return ""
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function resolveWorkspaceAcceleratorSupplementalResources({
  slug,
  title,
}: {
  slug?: string | null
  title?: string | null
}): WorkspaceAcceleratorCardStepResource[] {
  const slugToken = normalizeModuleResourceToken(slug)
  const titleToken = normalizeModuleResourceToken(title)

  if (
    slugToken.includes("intro-idea-to-impact-accelerator") ||
    titleToken.includes("introduction-idea-to-impact-accelerator")
  ) {
    return COMMUNITY_RESOURCE_LINKS
  }

  return (
    FORMATION_RESOURCE_LINKS[slugToken] ??
    FORMATION_RESOURCE_LINKS[titleToken] ??
    []
  )
}

export function mergeWorkspaceAcceleratorResources(
  resources: WorkspaceAcceleratorCardStepResource[],
  supplementalResources: WorkspaceAcceleratorCardStepResource[],
) {
  const seenUrls = new Set(
    resources.map((resource) => resource.url.toLowerCase()),
  )
  const next = [...resources]
  for (const resource of supplementalResources) {
    const normalizedUrl = resource.url.toLowerCase()
    if (seenUrls.has(normalizedUrl)) continue
    seenUrls.add(normalizedUrl)
    next.push(resource)
  }
  return next
}

export function isOrganizationSetupTimelineModule({
  roadmapModule,
  moduleRecord,
}: {
  roadmapModule: Pick<ModuleCard, "id" | "slug" | "title" | "href">
  moduleRecord?: Pick<ModuleRecord, "slug" | "title"> | null
}) {
  if (roadmapModule.id === ORGANIZATION_SETUP_MODULE_ID) return true
  if (hasOrganizationSetupSlugSignal(roadmapModule.slug)) return true
  if (hasOrganizationSetupTitleSignal(roadmapModule.title)) return true
  if (typeof roadmapModule.href === "string") {
    const href = roadmapModule.href.toLowerCase()
    if (
      href.includes("source=formation-setup") ||
      href.includes("source=workspace-setup")
    ) {
      return true
    }
  }
  if (moduleRecord) {
    if (hasOrganizationSetupSlugSignal(moduleRecord.slug)) return true
    if (hasOrganizationSetupTitleSignal(moduleRecord.title)) return true
  }
  return false
}
