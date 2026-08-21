import { unstable_cache } from "next/cache"

import { buildHomeMapPreviewFeatures } from "@/lib/public-map/home-map-preview"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"
import { fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"

const fetchHomeMapPreviewFeaturesCached = unstable_cache(
  async () => {
    const [organizations, resourceItems] = await Promise.all([
      fetchPublicMapOrganizations(),
      fetchPublicResourceMapItems({
        ignoreLocalPreviewFile: true,
        includeDiscoveryCandidates: false,
        limit: 1_000,
      }),
    ])
    return buildHomeMapPreviewFeatures({ organizations, resourceItems })
  },
  ["public-home-map-preview-v7"],
  { revalidate: 300, tags: ["public-home-map-preview"] }
)

export async function fetchHomeMapPreviewFeatures() {
  return fetchHomeMapPreviewFeaturesCached()
}
