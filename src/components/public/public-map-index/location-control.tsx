"use client"

import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { PublicMapDirectoryStatusPill } from "./directory-status-pill"
import { PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME } from "./sidebar-theme"
import type {
  PublicMapUserCoordinates,
  UserLocationFeedback,
  UserLocationStatus,
} from "./user-location"

export type PublicMapLocationControlState = {
  active: boolean
  coordinates: PublicMapUserCoordinates | null
  controlOpen: boolean
  feedback: UserLocationFeedback
  onConfirm: () => void
  onControlClick: () => void
  onOpenChange: (open: boolean) => void
  status: UserLocationStatus
}

function resolveLocationControlLabel({
  active,
  status,
}: Pick<PublicMapLocationControlState, "active" | "status">) {
  if (active) return "Recenter on my location"
  if (status === "requesting" || status === "checking") {
    return "Finding my location"
  }
  return "Use my location"
}

export function PublicMapLocationControl({
  active,
  controlOpen,
  directoryCount,
  feedback,
  onConfirm,
  onControlClick,
  onOpenChange,
  status,
}: PublicMapLocationControlState & { directoryCount: number | null }) {
  const isPending = status === "checking" || status === "requesting"
  const isConsentPrompt = status === "idle" || status === "prompt"
  const label = resolveLocationControlLabel({ active, status })

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={label}
              aria-pressed={active}
              aria-busy={isPending}
              aria-expanded={controlOpen}
              aria-controls="public-map-location-card"
              className={cn(
                PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
                "hover:bg-input/50 pointer-events-auto size-8 rounded-full shadow-sm",
                active && "border-blue-500/60 text-blue-600 dark:text-blue-400"
              )}
              onClick={onControlClick}
            >
              <LocateFixedIcon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
        <PublicMapDirectoryStatusPill count={directoryCount} />
      </div>
      {controlOpen ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Card
            id="public-map-location-card"
            role="dialog"
            aria-modal="false"
            className={cn(
              PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
              "pointer-events-auto w-full max-w-72 rounded-2xl py-0 shadow-lg"
            )}
          >
            <CardContent className="p-4">
              {isConsentPrompt ? (
                <>
                  <p className="text-sm font-semibold">Use your location?</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Coach House uses it only to center this map. Your location
                    is not saved.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={onConfirm}
                    >
                      Use location
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => onOpenChange(false)}
                    >
                      Not now
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    {isPending
                      ? "Finding your location"
                      : "Location unavailable"}
                  </p>
                  {feedback ? (
                    <p
                      className={cn(
                        "mt-1 text-xs leading-relaxed",
                        feedback.tone === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {feedback.message}
                    </p>
                  ) : null}
                  {!isPending ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full"
                      onClick={onConfirm}
                    >
                      Try again
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
