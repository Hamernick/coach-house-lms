"use client"

import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { WorkspaceTutorialCallout } from "../../workspace-tutorial-callout"
import type { WorkspaceCardShortcutItemModel } from "./workspace-card-shortcut-model"

const WORKSPACE_SHORTCUT_ICON_ACCENTS: Record<
  WorkspaceCardShortcutItemModel["id"],
  {
    surfaceClassName: string
    iconClassName: string
  }
> = {
  "organization-overview": {
    surfaceClassName: "bg-slate-500/10 dark:bg-slate-400/12",
    iconClassName: "text-slate-700 dark:text-slate-200",
  },
  accelerator: {
    surfaceClassName: "bg-sky-500/10 dark:bg-sky-400/12",
    iconClassName: "text-sky-700 dark:text-sky-200",
  },
  calendar: {
    surfaceClassName: "bg-emerald-500/10 dark:bg-emerald-400/12",
    iconClassName: "text-emerald-700 dark:text-emerald-200",
  },
  programs: {
    surfaceClassName: "bg-amber-500/10 dark:bg-amber-400/12",
    iconClassName: "text-amber-700 dark:text-amber-200",
  },
  vault: {
    surfaceClassName: "bg-slate-500/10 dark:bg-slate-400/12",
    iconClassName: "text-slate-700 dark:text-slate-200",
  },
  "brand-kit": {
    surfaceClassName: "bg-slate-500/10 dark:bg-slate-400/12",
    iconClassName: "text-slate-700 dark:text-slate-200",
  },
  "economic-engine": {
    surfaceClassName: "bg-teal-500/10 dark:bg-teal-400/12",
    iconClassName: "text-teal-700 dark:text-teal-200",
  },
  communications: {
    surfaceClassName: "bg-orange-500/10 dark:bg-orange-400/12",
    iconClassName: "text-orange-700 dark:text-orange-200",
  },
}

const WORKSPACE_SHORTCUT_TUTORIAL_BUTTON_CLASSNAME =
  "border-sky-300/85 bg-sky-50/92 text-sky-700 shadow-[0_0_0_1px_rgba(125,211,252,0.35),0_10px_20px_-18px_rgba(14,165,233,0.55)] dark:border-sky-400/65 dark:bg-sky-500/10 dark:text-sky-200 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.3),0_10px_20px_-18px_rgba(56,189,248,0.5)]"

const WORKSPACE_SHORTCUT_TUTORIAL_ICON_SURFACE_CLASSNAME =
  "bg-white/88 dark:bg-sky-500/14"

const WORKSPACE_SHORTCUT_TUTORIAL_ICON_CLASSNAME =
  "text-sky-700 dark:text-sky-200"

export function WorkspaceCardShortcutButton({
  item,
}: {
  item: WorkspaceCardShortcutItemModel
}) {
  const Icon = item.icon
  const tutorialCallout = item.tutorialCallout
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const tutorialHighlighted = item.tutorialHighlighted
  const iconAccent = WORKSPACE_SHORTCUT_ICON_ACCENTS[item.id]

  const iconNode = (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-[8px] transition-colors duration-150",
        iconAccent.surfaceClassName,
        tutorialHighlighted && WORKSPACE_SHORTCUT_TUTORIAL_ICON_SURFACE_CLASSNAME,
        item.selected && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-colors duration-150",
          iconAccent.iconClassName,
          tutorialHighlighted && WORKSPACE_SHORTCUT_TUTORIAL_ICON_CLASSNAME,
          !item.visible && !item.selected && "opacity-80",
        )}
        aria-hidden
      />
    </span>
  )

  if (tutorialCallout) {
    return (
      <>
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={item.onPress}
          aria-label={item.title}
          aria-pressed={item.selected}
          className={cn(
            "h-[34px] w-[34px] rounded-[12px] border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
            item.selected
              ? "border-neutral-300/80 bg-neutral-100/74 text-neutral-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] dark:border-neutral-700/75 dark:bg-neutral-900/90 dark:text-neutral-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : item.visible
                ? "border-neutral-300/65 bg-neutral-100/58 text-neutral-500 dark:border-neutral-700/70 dark:bg-neutral-900/85 dark:text-neutral-300"
                : "border-neutral-300/55 bg-neutral-100/40 text-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-900/72 dark:text-neutral-500",
            WORKSPACE_SHORTCUT_TUTORIAL_BUTTON_CLASSNAME,
          )}
        >
          {iconNode}
        </Button>
        <WorkspaceTutorialCallout
          anchorRef={buttonRef}
          title={item.title}
          instruction={tutorialCallout.instruction}
          emphasis="tap-here"
        />
      </>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          onClick={item.onPress}
          aria-label={item.title}
          aria-pressed={item.selected}
          className={cn(
            "h-[34px] w-[34px] rounded-[12px] border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
            item.selected
              ? "border-neutral-300/80 bg-neutral-100/74 text-neutral-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] dark:border-neutral-700/75 dark:bg-neutral-900/90 dark:text-neutral-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : item.visible
                ? "border-neutral-300/65 bg-neutral-100/58 text-neutral-500 dark:border-neutral-700/70 dark:bg-neutral-900/85 dark:text-neutral-300"
                : "border-neutral-300/55 bg-neutral-100/40 text-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-900/72 dark:text-neutral-500",
            tutorialHighlighted && WORKSPACE_SHORTCUT_TUTORIAL_BUTTON_CLASSNAME,
          )}
        >
          {iconNode}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" align="center" sideOffset={12}>
        {item.title}
      </TooltipContent>
    </Tooltip>
  )
}
