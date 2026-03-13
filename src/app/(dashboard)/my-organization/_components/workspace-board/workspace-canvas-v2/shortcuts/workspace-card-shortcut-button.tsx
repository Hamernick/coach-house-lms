"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { WorkspaceTutorialCallout } from "../../workspace-tutorial-callout"
import type { WorkspaceCardShortcutItemModel } from "./workspace-card-shortcut-model"

const WORKSPACE_SHORTCUT_TUTORIAL_BUTTON_CLASSNAME =
  "border-sky-300/65 bg-sky-50/86 text-sky-700 shadow-[0_10px_20px_-20px_rgba(14,165,233,0.6)] dark:border-sky-400/50 dark:bg-sky-500/10 dark:text-sky-200 dark:shadow-[0_10px_20px_-20px_rgba(56,189,248,0.55)]"

export function WorkspaceCardShortcutButton({
  item,
}: {
  item: WorkspaceCardShortcutItemModel
}) {
  const Icon = item.icon
  const tutorialCallout = item.tutorialCallout
  const tutorialHighlighted = item.tutorialHighlighted
  const isActive = item.selected || item.visible || tutorialHighlighted

  const iconNode = (
    <Icon
      className={cn(
        "h-4.5 w-4.5 transition-colors duration-150",
        item.selected && "opacity-95",
        item.visible && !item.selected && "opacity-90",
        !item.visible && !item.selected && "opacity-80",
        isActive
          ? "text-sky-700 dark:text-sky-200"
          : "text-slate-500 dark:text-slate-400",
      )}
      aria-hidden
    />
  )

  if (tutorialCallout) {
    return (
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={item.onPress}
            aria-label={item.title}
            aria-pressed={item.selected}
            className={cn(
              "h-[34px] w-[34px] rounded-[12px] border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
              item.selected
                ? "border-sky-300/80 bg-sky-50/88 text-sky-700 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] dark:border-sky-400/60 dark:bg-sky-500/12 dark:text-sky-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : item.visible
                  ? "border-sky-300/70 bg-sky-50/66 text-sky-700 dark:border-sky-400/50 dark:bg-sky-500/10 dark:text-sky-200"
                  : "border-neutral-300/55 bg-neutral-100/40 text-neutral-400 dark:border-neutral-700/60 dark:bg-neutral-900/72 dark:text-neutral-500",
              tutorialHighlighted && WORKSPACE_SHORTCUT_TUTORIAL_BUTTON_CLASSNAME,
            )}
          >
            {iconNode}
          </Button>
        </TooltipTrigger>
        <WorkspaceTutorialCallout
          title={item.title}
          instruction={tutorialCallout.instruction}
          emphasis="tap-here"
        />
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={item.onPress}
          aria-label={item.title}
          aria-pressed={item.selected}
          className={cn(
            "h-[34px] w-[34px] rounded-[12px] border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
            item.selected
              ? "border-sky-300/80 bg-sky-50/88 text-sky-700 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] dark:border-sky-400/60 dark:bg-sky-500/12 dark:text-sky-200 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : item.visible
                ? "border-sky-300/70 bg-sky-50/66 text-sky-700 dark:border-sky-400/50 dark:bg-sky-500/10 dark:text-sky-200"
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
