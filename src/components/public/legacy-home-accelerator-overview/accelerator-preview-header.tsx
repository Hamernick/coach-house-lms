"use client"

import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { AcceleratorPreviewSlide } from "./types"

type AcceleratorPreviewHeaderProps = {
  headingClassName: string
  activeSlide: number
  slides: AcceleratorPreviewSlide[]
  onJumpToSlide: (index: number) => void
}

export function AcceleratorPreviewHeader({
  headingClassName,
  activeSlide,
  slides,
  onJumpToSlide,
}: AcceleratorPreviewHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(headingClassName, "text-base font-semibold tracking-tight text-foreground")}>
          The Idea to Impact Accelerator
        </span>
        <span className="text-xs font-medium text-muted-foreground">Included on paid tiers</span>
      </div>

      <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 p-1">
        {slides.map((item, index) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            onClick={() => onJumpToSlide(index)}
            className="relative h-8 overflow-hidden rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-transparent hover:text-foreground"
            aria-pressed={activeSlide === index}
            aria-label={`Show ${item.tab}`}
          >
            {activeSlide === index ? (
              <motion.span
                layoutId="accelerator-slide-tab"
                className="absolute inset-0 rounded-full border border-border/70 bg-background shadow-sm"
                transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
              />
            ) : null}
            <span className={cn("relative z-10", activeSlide === index && "text-foreground")}>
              {item.tab}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
