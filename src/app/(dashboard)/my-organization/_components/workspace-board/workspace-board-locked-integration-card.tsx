"use client"

import LockIcon from "lucide-react/dist/esm/icons/lock"
import PlugZapIcon from "lucide-react/dist/esm/icons/plug-zap"

import { cn } from "@/lib/utils"

import type { WorkspaceCardSize } from "./workspace-board-types"

type LockedIntegrationCardVariant = "economic-engine" | "communications"

type LockedIntegrationCardConfig = {
  label: string
  summary: string
  integrations: string[]
  canvasHint: string
  fullscreenBullets: string[]
}

const LOCKED_CARD_CONFIG: Record<LockedIntegrationCardVariant, LockedIntegrationCardConfig> = {
  "economic-engine": {
    label: "Economic engine",
    summary:
      "Financial connections are coming soon. You’ll be able to connect revenue and account systems to track inflows, reserves, and operating health in one place.",
    integrations: ["Stripe", "Bank account", "Square", "PayPal", "QuickBooks"],
    canvasHint: "Open fullscreen to preview the setup and planned connected-finance workflow.",
    fullscreenBullets: [
      "Connect payment processors and bank accounts",
      "Track deposits, payouts, and cash movement",
      "Surface fundraising and earned-revenue signals in one view",
    ],
  },
  communications: {
    label: "Communications",
    summary:
      "Channel publishing integrations are coming soon. You’ll be able to connect social and email platforms to draft, schedule, and distribute updates from the workspace.",
    integrations: ["LinkedIn", "Instagram", "Facebook", "X", "YouTube", "Mailchimp"],
    canvasHint: "Open fullscreen to preview the publishing setup and connected-channel workflow.",
    fullscreenBullets: [
      "Connect social and email channels",
      "Manage posting destinations and channel health",
      "Draft and schedule updates from a single editor",
    ],
  },
}

export function WorkspaceBoardLockedIntegrationCard({
  variant,
  cardSize,
  isCanvasFullscreen = false,
}: {
  variant: LockedIntegrationCardVariant
  cardSize: WorkspaceCardSize
  isCanvasFullscreen?: boolean
}) {
  const config = LOCKED_CARD_CONFIG[variant]
  const compactCanvasCard = !isCanvasFullscreen && cardSize === "sm"

  return (
    <div className={cn("flex h-full min-h-0 flex-col", isCanvasFullscreen ? "gap-4" : "gap-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <PlugZapIcon className="h-3.5 w-3.5" aria-hidden />
            <span>Coming soon</span>
          </div>
          <p className={cn("leading-relaxed text-muted-foreground", compactCanvasCard ? "text-xs" : "text-sm")}>
            {config.summary}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-medium text-foreground">
          <LockIcon className="h-3 w-3" aria-hidden />
          Locked
        </span>
      </div>

      <div className="border-t border-border/50 pt-3">
        <p className="text-xs text-muted-foreground">Planned connections</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {config.integrations.map((integration) => (
            <span
              key={`${variant}-${integration}`}
              className="inline-flex items-center rounded-full border border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-foreground"
            >
              {integration}
            </span>
          ))}
        </div>
      </div>

      {isCanvasFullscreen ? (
        <div className="border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground">What you’ll be able to do</p>
          <ul className="mt-2 space-y-2">
            {config.fullscreenBullets.map((bullet) => (
              <li key={`${variant}-bullet-${bullet}`} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" aria-hidden />
                <span className="leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-auto text-xs text-muted-foreground">{config.canvasHint}</p>
      )}
    </div>
  )
}
