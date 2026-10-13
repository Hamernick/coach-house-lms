import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import {
  PublicMapResourceAddressSection,
  PublicMapResourceDetailChrome,
  PublicMapResourceIdentitySection,
  PublicMapResourceSourceAction,
  PublicMapResourceStatusSection,
} from "./resource-detail-primary-sections"
import {
  PublicMapResourceAccessSection,
  PublicMapResourceContactSection,
  PublicMapResourceLinksSection,
  PublicMapResourceServicesSection,
} from "./resource-detail-resource-sections"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import { PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME } from "./sidebar-theme"

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
      className={cn(
        "border-border/60 text-card-foreground space-y-3 border-b bg-transparent pt-3",
        compact
          ? "px-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
          : "px-2 pb-3"
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
      <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
        <p className="text-sm font-medium">About</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {item.description ||
            "This resource is listed from external data and is being prepared for review."}
        </p>
      </section>
      <PublicMapResourceServicesSection item={item} />
      <PublicMapResourceAccessSection item={item} />
      <PublicMapResourceStatusSection item={item} />
      <PublicMapResourceAddressSection item={item} />
      <PublicMapResourceSourceAction item={item} />
    </div>
  )
}
