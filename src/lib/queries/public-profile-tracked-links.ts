import "server-only"

import { randomBytes } from "node:crypto"

import {
  isPublicMapTechnicalSourceUrl,
  shouldShowPublicMapResourceLink,
} from "@/lib/public-map/resource-link-visibility"
import type { PublicMapResourceLink } from "@/lib/public-map/resource-map-items"
import { fetchPublicResourceMapItemById } from "@/lib/queries/resource-map-public-items"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type TrackedLinkRow = {
  code: string
  resource_title: string
}

function safeTrackedDestination(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function linkPriority(link: PublicMapResourceLink) {
  if (link.type === "website") return 0
  if (link.isPrimary) return 1
  if (link.type === "apply" || link.type === "intake") return 2
  return 3
}

function resolveTrackedDestination(input: {
  links?: PublicMapResourceLink[]
  sourceUrl?: string | null
}) {
  const publicLinks = (input.links ?? [])
    .filter(shouldShowPublicMapResourceLink)
    .map((link) => ({ link, targetUrl: safeTrackedDestination(link.url) }))
    .filter(
      (
        candidate
      ): candidate is { link: PublicMapResourceLink; targetUrl: string } =>
        Boolean(candidate.targetUrl)
    )
    .sort((left, right) => linkPriority(left.link) - linkPriority(right.link))

  const sourceUrl = safeTrackedDestination(input.sourceUrl)
  const publicSourceUrl =
    sourceUrl && !isPublicMapTechnicalSourceUrl(sourceUrl) ? sourceUrl : null
  return publicLinks[0]?.targetUrl ?? publicSourceUrl
}

export async function createTrackedResourceLink(input: {
  ownerProfileId: string
  resourceId: string
}) {
  const resource = await fetchPublicResourceMapItemById(input.resourceId)
  if (!resource) {
    return { ok: false as const, error: "Resource not found." }
  }

  const targetUrl = resolveTrackedDestination(resource)
  if (!targetUrl) {
    return {
      ok: false as const,
      error: "This resource does not have a shareable provider link.",
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from("public_person_profiles")
    .select("profile_id")
    .eq("profile_id", input.ownerProfileId)
    .maybeSingle<{ profile_id: string }>()
  if (!profile) {
    return {
      ok: false as const,
      error: "Choose a public username before creating tracked links.",
    }
  }

  const findExisting = () =>
    supabase
      .from("public_tracked_resource_links")
      .select("code, resource_title")
      .eq("owner_profile_id", input.ownerProfileId)
      .eq("resource_id", resource.id)
      .eq("target_url", targetUrl)
      .eq("is_active", true)
      .maybeSingle<TrackedLinkRow>()

  const { data: existing } = await findExisting()
  if (existing) {
    return {
      ok: true as const,
      code: existing.code,
      resourceTitle: existing.resource_title,
    }
  }

  const resourceTitle = resource.title.trim().slice(0, 160)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = randomBytes(8).toString("base64url").slice(0, 11)
    const { data, error } = await supabase
      .from("public_tracked_resource_links")
      .insert({
        code,
        owner_profile_id: input.ownerProfileId,
        resource_id: resource.id,
        resource_title: resourceTitle,
        target_url: targetUrl,
      })
      .select("code, resource_title")
      .single<TrackedLinkRow>()

    if (!error && data) {
      return {
        ok: true as const,
        code: data.code,
        resourceTitle: data.resource_title,
      }
    }
    if (error?.code !== "23505") break

    const { data: racedExisting } = await findExisting()
    if (racedExisting) {
      return {
        ok: true as const,
        code: racedExisting.code,
        resourceTitle: racedExisting.resource_title,
      }
    }
  }

  return { ok: false as const, error: "Unable to create a tracked link." }
}
