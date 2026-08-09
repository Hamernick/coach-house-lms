import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import {
  PublicMapResourceAddressSection,
  PublicMapResourceDetailChrome,
  PublicMapResourceIdentitySection,
  PublicMapResourceStatusSection,
} from "./resource-detail-primary-sections"
import {
  PublicMapResourceAccessSection,
  PublicMapResourceContactSection,
  PublicMapResourceLinksSection,
  PublicMapResourceServicesSection,
} from "./resource-detail-resource-sections"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import {
  PUBLIC_MAP_DETAIL_BODY_CLASSNAME,
  PUBLIC_MAP_DETAIL_PROFILE_CLASSNAME,
  PUBLIC_MAP_DETAIL_SECTION_CLASSNAME,
} from "./sidebar-theme"

export function PublicMapResourceDetail({
  canManageResourceMap = false,
  item,
  compact = false,
  onBack,
  resourceMapCurationAction,
}: {
  canManageResourceMap?: boolean
  item: ExternalResourceMapItem
  compact?: boolean
  onBack: () => void
  resourceMapCurationAction?: PublicMapResourceCurationAction
}) {
  return (
    <div
      data-public-map-profile="resource"
      className={cn(
        PUBLIC_MAP_DETAIL_PROFILE_CLASSNAME,
        compact ? "mb-[max(env(safe-area-inset-bottom),0.75rem)]" : "mb-3"
      )}
    >
      <PublicMapResourceDetailChrome
        canManageResourceMap={canManageResourceMap}
        item={item}
        onBack={onBack}
        resourceMapCurationAction={resourceMapCurationAction}
      />
      <PublicMapResourceIdentitySection item={item} />
      <PublicMapResourceLinksSection item={item} />
      <PublicMapResourceContactSection item={item} />
      <section className={PUBLIC_MAP_DETAIL_SECTION_CLASSNAME}>
        <h3 className="text-base font-semibold">About</h3>
        <p className={cn("mt-1.5", PUBLIC_MAP_DETAIL_BODY_CLASSNAME)}>
          {item.description ||
            "This resource is listed from external data and is being prepared for review."}
        </p>
      </section>
      <PublicMapResourceServicesSection item={item} />
      <PublicMapResourceAccessSection item={item} />
      <PublicMapResourceStatusSection item={item} />
      <PublicMapResourceAddressSection item={item} />
    </div>
  )
}
