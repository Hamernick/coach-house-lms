"use client"

import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type WorkspaceTutorialCalloutProps = {
  title: string
  instruction: string
  emphasis?: "default" | "tap-here"
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
}

export function WorkspaceTutorialCallout({
  title,
  instruction,
  emphasis = "default",
  className,
  side = "left",
  align = "center",
  sideOffset = 12,
  alignOffset = 0,
}: WorkspaceTutorialCalloutProps) {
  return (
    <TooltipContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={cn(
        "w-[17rem] whitespace-normal rounded-xl border border-primary/40 bg-primary px-3.5 py-3.5 text-primary-foreground shadow-[0_10px_30px_rgba(15,23,42,0.28)]",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
        <p className="min-w-0 text-[17px] font-semibold leading-5">{title}</p>
        {emphasis === "tap-here" ? (
          <p className="inline-flex items-center gap-1.5 self-start whitespace-nowrap pt-0.5 text-sm font-medium text-primary-foreground">
            <span>Click here</span>
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </p>
        ) : null}
        <p className="col-span-full text-sm leading-5 text-primary-foreground/90">
          {instruction}
        </p>
      </div>
    </TooltipContent>
  )
}
