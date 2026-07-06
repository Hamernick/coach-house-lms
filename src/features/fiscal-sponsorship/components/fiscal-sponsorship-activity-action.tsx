"use client"

import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipActivityEligibility } from "../lib/activity-eligibility"
import { FiscalSponsorshipMark } from "./fiscal-sponsorship-mark"

export function FiscalSponsorshipActivityAction({
  active,
  ariaLabel,
  disabled = false,
  eligibility,
  onOpen,
  onUpdateInfo,
}: {
  active: boolean
  ariaLabel?: string
  disabled?: boolean
  eligibility: FiscalSponsorshipActivityEligibility
  onOpen: () => void
  onUpdateInfo: () => void
}) {
  const markState = active ? "active" : eligibility.state
  const actionLabel = eligibility.eligible ? "Request review" : "Update info"
  const statusLabel = active
    ? "Open"
    : eligibility.eligible
      ? "Review ready"
      : "Needs data"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg p-0 hover:bg-transparent"
          aria-label={
            ariaLabel ?? `Fiscal sponsorship ${statusLabel.toLowerCase()}`
          }
          aria-pressed={active}
          data-fiscal-sponsorship-eligibility-state={markState}
          disabled={disabled}
          onClick={() => {
            if (active || eligibility.eligible) {
              onOpen()
            }
          }}
        >
          <FiscalSponsorshipMark
            state={markState}
            className="size-8 rounded-lg text-xs"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[17rem] max-w-[calc(100vw-2rem)] rounded-xl p-2 text-xs whitespace-normal shadow-lg"
      >
        <div className="space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <FiscalSponsorshipMark
                state={markState}
                className="size-4 rounded-[0.35rem] text-[7px]"
              />
              <div className="min-w-0">
                <p className="text-foreground truncate font-medium">
                  Fiscal sponsorship
                </p>
                <p className="text-muted-foreground truncate text-[10px]">
                  Signals only. Coach House reviews.
                </p>
              </div>
            </div>
            <Badge
              variant={eligibility.eligible ? "default" : "secondary"}
              className="h-6 shrink-0 rounded-full px-2 text-[10px]"
            >
              {eligibility.label}
            </Badge>
          </div>
          <div className="space-y-1">
            {eligibility.criteria.map((criterion) => {
              const Icon = criterion.met ? CheckCircle2Icon : CircleDashedIcon

              return (
                <div
                  key={criterion.id}
                  className="flex min-w-0 items-center gap-2"
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      criterion.met
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <span className="text-foreground min-w-0 flex-1 truncate">
                    {criterion.label}
                  </span>
                  {criterion.met ? (
                    <CheckCircle2Icon
                      className="size-3.5 shrink-0 text-emerald-600"
                      aria-label="Complete"
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 rounded-full px-2 text-[10px]"
                      disabled={disabled}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onUpdateInfo()
                      }}
                    >
                      Add
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          <Button
            type="button"
            size="sm"
            className="h-7 w-full rounded-full text-xs"
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (eligibility.eligible) {
                onOpen()
                return
              }

              onUpdateInfo()
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
