import "server-only"

import type {
  PublicProfileSavedCollection,
  PublicProfileSavedItem,
} from "@/features/public-profiles"
import { buildFindOrganizationHref, FIND_PATH } from "@/lib/find/routes"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"
import { fetchPublicResourceMapItemsByIds } from "@/lib/queries/resource-map-public-items"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export type PublicSavedItemReference = {
  kind: "organization" | "resource"
  id: string
  position: number
}

type PublicSavedCollectionRow = {
  id: string
  name: string
  is_public: boolean
}

type PublicSavedCollectionItemRow = {
  collection_id: string
  item_kind: "organization" | "resource"
  item_id: string
  position: number
}

function locationLabel(input: {
  city: string | null
  state: string | null
  country: string | null
  isOnlineOnly?: boolean
}) {
  const place = [input.city, input.state, input.country]
    .filter(Boolean)
    .join(", ")
  return place || (input.isOnlineOnly ? "Online" : null)
}

export async function resolvePublicSavedItems(
  references: PublicSavedItemReference[]
): Promise<PublicProfileSavedItem[]> {
  const organizationIds = references
    .filter((reference) => reference.kind === "organization")
    .map((reference) => reference.id)
  const resourceIds = references
    .filter((reference) => reference.kind === "resource")
    .map((reference) => reference.id)
  const [organizations, resources] = await Promise.all([
    organizationIds.length > 0 ? fetchPublicMapOrganizations() : [],
    fetchPublicResourceMapItemsByIds(resourceIds),
  ])
  const organizationById = new Map(
    organizations
      .filter((organization) => organizationIds.includes(organization.id))
      .map((organization) => [organization.id, organization])
  )
  const resourceById = new Map(
    resources.map((resource) => [resource.id, resource])
  )

  return [...references]
    .sort((left, right) => left.position - right.position)
    .flatMap((reference): PublicProfileSavedItem[] => {
      if (reference.kind === "organization") {
        const organization = organizationById.get(reference.id)
        if (!organization || !organization.publicSlug) return []
        return [
          {
            kind: "organization",
            id: reference.id,
            title: organization.name,
            subtitle: organization.tagline,
            locationLabel: locationLabel(organization),
            href: buildFindOrganizationHref(organization.publicSlug),
          },
        ]
      }

      const resource = resourceById.get(reference.id)
      if (!resource) return []
      return [
        {
          kind: "resource",
          id: reference.id,
          title: resource.title,
          subtitle: resource.subtitle,
          locationLabel: locationLabel(resource),
          href: `${FIND_PATH}?q=${encodeURIComponent(resource.title)}`,
        },
      ]
    })
}

export async function fetchPersonPublicSavedCollections(
  profileId: string
): Promise<PublicProfileSavedCollection[]> {
  const supabase = createSupabaseAdminClient()
  const { data: collections, error: collectionError } = await supabase
    .from("public_person_saved_collections")
    .select("id, name, is_public")
    .eq("profile_id", profileId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(12)
    .returns<PublicSavedCollectionRow[]>()
  if (collectionError || !collections?.length) {
    if (collectionError) {
      console.error("[public-profile] saved collection query failed", {
        code: collectionError.code,
        message: collectionError.message,
      })
    }
    return []
  }

  const collectionIds = collections.map((collection) => collection.id)
  const { data: rows, error: itemError } = await supabase
    .from("public_person_saved_collection_items")
    .select("collection_id, item_kind, item_id, position")
    .in("collection_id", collectionIds)
    .order("position", { ascending: true })
    .returns<PublicSavedCollectionItemRow[]>()
  if (itemError) {
    console.error("[public-profile] saved collection item query failed", {
      code: itemError.code,
      message: itemError.message,
    })
    return []
  }

  const resolvedItems = await resolvePublicSavedItems(
    (rows ?? []).map((row) => ({
      kind: row.item_kind,
      id: row.item_id,
      position: row.position,
    }))
  )
  const itemByKey = new Map(
    resolvedItems.map((item) => [`${item.kind}:${item.id}`, item])
  )

  return collections.flatMap((collection): PublicProfileSavedCollection[] => {
    const items = (rows ?? []).flatMap((row) => {
      if (row.collection_id !== collection.id) return []
      const item = itemByKey.get(`${row.item_kind}:${row.item_id}`)
      return item ? [item] : []
    })
    return items.length > 0
      ? [
          {
            id: collection.id,
            name: collection.name,
            isPublic: true,
            items,
          },
        ]
      : []
  })
}
