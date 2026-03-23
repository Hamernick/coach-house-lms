"use client"

import * as React from "react"
import { useReducedMotion } from "framer-motion"
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import ArrowUpIcon from "lucide-react/dist/esm/icons/arrow-up"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { WORKSPACE_TUTORIAL_OUTLINE_BUTTON_SURFACE_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { cn } from "@/lib/utils"

const WORKSPACE_TUTORIAL_INDICATOR_TRIGGER_SIZE = 40
const WORKSPACE_TUTORIAL_CALLOUT_SETTLE_DELAY_MS = 420
const WORKSPACE_TUTORIAL_CALLOUT_REDUCED_MOTION_DELAY_MS = 120
const WORKSPACE_TUTORIAL_CALLOUT_SOURCE =
  "src/components/workspace/workspace-tutorial-callout.tsx"
const WORKSPACE_TUTORIAL_THEME_SOURCE =
  "src/components/workspace/workspace-tutorial-theme.ts"

type WorkspaceTutorialCalloutProps = {
  reactGrabOwnerId?: string
  title?: string
  instruction?: string
  emphasis?: "default" | "tap-here"
  tapHereLabel?: string
  className?: string
  tooltipContentClassName?: string
  indicatorAnchorAlign?: "center" | "start" | "end"
  indicatorAnchorVerticalAlign?: "top" | "center" | "bottom"
  indicatorOffsetX?: number
  indicatorOffsetY?: number
  indicatorSide?: "top" | "right" | "bottom" | "left"
  indicatorSideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  mode?: "tooltip" | "indicator"
}

export function WorkspaceTutorialCallout({
  title = "",
  instruction = "",
  emphasis = "default",
  tapHereLabel,
  className,
  tooltipContentClassName,
  indicatorAnchorAlign = "center",
  indicatorAnchorVerticalAlign = "top",
  indicatorOffsetX = 0,
  indicatorOffsetY = 0,
  indicatorSide = "top",
  indicatorSideOffset = 10,
  side = "left",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  mode = "tooltip",
  reactGrabOwnerId,
}: WorkspaceTutorialCalloutProps) {
  const resolvedReactGrabOwnerId = React.useMemo(() => {
    if (reactGrabOwnerId) return reactGrabOwnerId

    const descriptorSeed = [
      mode,
      emphasis,
      tapHereLabel,
      title,
      instruction,
      indicatorSide,
      side,
      align,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return `workspace-tutorial-callout:${descriptorSeed || "default"}`
  }, [
    align,
    emphasis,
    indicatorSide,
    instruction,
    mode,
    reactGrabOwnerId,
    side,
    tapHereLabel,
    title,
  ])
  const prefersReducedMotion = useReducedMotion()
  const calloutSettleKey = React.useMemo(
    () =>
      [
        resolvedReactGrabOwnerId,
        mode,
        title,
        instruction,
        tapHereLabel,
        indicatorSide,
        side,
        align,
      ].join("::"),
    [
      align,
      indicatorSide,
      instruction,
      mode,
      resolvedReactGrabOwnerId,
      side,
      tapHereLabel,
      title,
    ],
  )
  const [calloutReady, setCalloutReady] = React.useState(false)

  React.useEffect(() => {
    setCalloutReady(false)
    const settleDelayMs = prefersReducedMotion
      ? WORKSPACE_TUTORIAL_CALLOUT_REDUCED_MOTION_DELAY_MS
      : WORKSPACE_TUTORIAL_CALLOUT_SETTLE_DELAY_MS
    let timeoutId: number | null = null
    const rafId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setCalloutReady(true)
      }, settleDelayMs)
    })

    return () => {
      window.cancelAnimationFrame(rafId)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [calloutSettleKey, prefersReducedMotion])

  const calloutVisibilityClassName = cn(
    "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
    calloutReady ? "opacity-100" : "opacity-0",
  )

  if (mode === "indicator") {
    const IndicatorIcon =
      indicatorSide === "right"
        ? ArrowLeftIcon
        : indicatorSide === "left"
          ? ArrowRightIcon
          : indicatorSide === "bottom"
            ? ArrowUpIcon
            : ArrowDownIcon
    const indicatorAnchorStyle =
      indicatorAnchorAlign === "center"
        ? { left: "50%" }
        : indicatorAnchorAlign === "end"
          ? { right: 0 }
          : {
              left: 0,
            }
    const indicatorVerticalAnchorStyle =
      indicatorAnchorVerticalAlign === "center"
        ? { top: "50%" }
        : indicatorAnchorVerticalAlign === "bottom"
          ? { bottom: 0 }
          : { top: 0 }
    const indicatorTranslateX =
      indicatorAnchorAlign === "center"
        ? `calc(-50% + ${indicatorOffsetX}px)`
        : `${indicatorOffsetX}px`
    const indicatorTranslateY =
      indicatorAnchorVerticalAlign === "center"
        ? `calc(-50% + ${indicatorOffsetY}px)`
        : `${indicatorOffsetY}px`

    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute z-50", className)}
        {...getReactGrabOwnerProps({
          ownerId: resolvedReactGrabOwnerId,
          component: "WorkspaceTutorialCallout",
          source: WORKSPACE_TUTORIAL_CALLOUT_SOURCE,
          slot: "indicator-anchor",
          variant: tapHereLabel ? "labeled" : "icon",
          tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
          primitiveImport: "@/components/ui/tooltip",
        })}
        style={{
          ...indicatorAnchorStyle,
          ...indicatorVerticalAnchorStyle,
          transform: `translate(${indicatorTranslateX}, ${indicatorTranslateY})`,
        }}
      >
        <Tooltip open>
          <TooltipTrigger asChild>
            <span
              data-slot="workspace-tutorial-indicator-anchor"
              className="pointer-events-none block size-10"
            />
          </TooltipTrigger>
          <TooltipContent
            side={indicatorSide}
            align={indicatorSide === "top" && tapHereLabel ? "start" : "center"}
            sideOffset={indicatorSideOffset}
            className={cn(
              "pointer-events-none",
              calloutVisibilityClassName,
              tooltipContentClassName,
            )}
            {...getReactGrabLinkedSurfaceProps({
              ownerId: resolvedReactGrabOwnerId,
              component: "WorkspaceTutorialCallout",
              source: WORKSPACE_TUTORIAL_CALLOUT_SOURCE,
              slot: "indicator-bubble",
              surfaceKind: "content",
              tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
              primitiveImport: "@/components/ui/tooltip",
            })}
            data-react-grab-role="workspace-tutorial-callout-bubble"
            data-workspace-tutorial-callout-ready={calloutReady ? "true" : "false"}
          >
            <div
              data-slot="workspace-tutorial-indicator"
              data-workspace-tutorial-indicator={tapHereLabel ? "labeled" : "icon"}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap",
                tapHereLabel
                  ? undefined
                  : "justify-center",
              )}
            >
              <span
                data-slot="workspace-tutorial-indicator-icon-wrap"
                className="inline-flex shrink-0 items-center justify-center"
                style={{
                  width: tapHereLabel
                    ? indicatorSide === "right"
                      ? undefined
                      : `${WORKSPACE_TUTORIAL_INDICATOR_TRIGGER_SIZE}px`
                    : undefined,
                }}
              >
                <IndicatorIcon
                  data-slot="workspace-tutorial-indicator-icon"
                  className="size-4"
                />
              </span>
              {tapHereLabel ? (
                <span
                  data-slot="workspace-tutorial-indicator-label"
                  className="inline-flex items-center"
                >
                  {tapHereLabel}
                </span>
              ) : null}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <TooltipContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      {...getReactGrabOwnerProps({
        ownerId: resolvedReactGrabOwnerId,
        component: "WorkspaceTutorialCallout",
        source: WORKSPACE_TUTORIAL_CALLOUT_SOURCE,
        slot: "tooltip-content",
        variant: emphasis,
        tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
        primitiveImport: "@/components/ui/tooltip",
      })}
      data-react-grab-role="workspace-tutorial-callout-bubble"
      data-workspace-tutorial-callout-ready={calloutReady ? "true" : "false"}
      className={cn(
        calloutVisibilityClassName,
        "workspace-tutorial-callout pointer-events-none whitespace-normal text-left",
        emphasis === "tap-here" && tapHereLabel
          ? "w-fit max-w-60 py-2 pl-2 pr-3"
          : "w-48",
        tooltipContentClassName,
        className,
      )}
    >
      {emphasis === "tap-here" && tapHereLabel ? (
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "size-9 shrink-0 rounded-xl [&_svg]:size-4",
              WORKSPACE_TUTORIAL_OUTLINE_BUTTON_SURFACE_CLASSNAME,
            )}
          >
            <ArrowDownIcon className="h-4 w-4" aria-hidden />
          </div>
          <p className="min-w-0 text-xs leading-tight text-current">
            {tapHereLabel}
          </p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          <p className="min-w-0 text-xs font-medium leading-tight text-current">
            {title}
          </p>
          {emphasis === "tap-here" ? (
            <p className="text-xs leading-tight text-current opacity-80">
              Click here.
            </p>
          ) : null}
          <p className="text-xs leading-tight text-current opacity-80">
            {instruction}
          </p>
        </div>
      )}
    </TooltipContent>
  )
}
