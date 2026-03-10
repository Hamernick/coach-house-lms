import { type ComponentType } from "react"

import Check from "lucide-react/dist/esm/icons/check"
import Layers from "lucide-react/dist/esm/icons/layers"
import Minus from "lucide-react/dist/esm/icons/minus"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import Users from "lucide-react/dist/esm/icons/users"
import X from "lucide-react/dist/esm/icons/x"

import { FEATURE_GROUPS, type FeatureState, type TierFeature } from "@/components/public/pricing-surface-data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type FeatureTone = "muted" | "solid"

export function CheckBadge({ tone = "muted" }: { tone?: FeatureTone }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px]",
        tone === "solid" ? "border-transparent bg-foreground text-primary-foreground" : "border-border/70 bg-muted/50 text-foreground",
      )}
      aria-hidden
    >
      <Check className="h-3 w-3" />
    </span>
  )
}

type TierFeaturesProps = {
  heading: string
  items: Array<string | TierFeature>
  tone?: FeatureTone
  hideHeading?: boolean
}

export function TierFeatures({
  heading,
  items,
  tone = "muted",
  hideHeading = false,
}: TierFeaturesProps) {
  return (
    <div className="space-y-3">
      {hideHeading ? null : (
        <p
          className={cn(
            "font-semibold",
            tone === "solid" ? "text-sm text-foreground" : "text-xs uppercase text-muted-foreground",
          )}
        >
          {heading}
        </p>
      )}
      <ul className="space-y-2 text-sm">
        {items.map((item) => {
          const feature = typeof item === "string" ? { label: item } : item
          const key = typeof item === "string" ? item : `${feature.label}-${feature.badge ?? ""}-${feature.detail ?? ""}`

          return (
            <li key={key} className="flex items-start gap-2">
              <CheckBadge tone={tone} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(tone === "solid" ? "text-foreground" : "text-muted-foreground")}>{feature.label}</span>
                {feature.badge ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      feature.badge.toLowerCase() === "coming soon" && "border border-border/70 bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {feature.badge}
                  </Badge>
                ) : null}
                {feature.detail ? <span className="text-muted-foreground">{feature.detail}</span> : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const FEATURE_GROUP_ICONS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "Platform foundations": Layers,
  "Team + community": Users,
  "Learning + readiness": Sparkles,
  "Operations + delivery support": Rocket,
}

export function FeatureStateIcon({ state, featured }: { state: FeatureState; featured?: boolean }) {
  if (state === "included") {
    return <Check className={cn("h-4 w-4", featured ? "text-background" : "text-foreground")} aria-hidden />
  }
  if (state === "na") {
    return <Minus className={cn("h-4 w-4", featured ? "text-background/50" : "text-muted-foreground")} aria-hidden />
  }
  return <X className={cn("h-4 w-4", featured ? "text-background/50" : "text-muted-foreground")} aria-hidden />
}

export const PRICING_FEATURE_GROUPS = FEATURE_GROUPS
