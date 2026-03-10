"use client"

import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import type { AcceleratorPreviewSlide } from "./types"

type AcceleratorPreviewDotsProps = {
  activeSlide: number
  slides: AcceleratorPreviewSlide[]
  onJumpToSlide: (index: number) => void
}

export function AcceleratorPreviewDots({
  activeSlide,
  slides,
  onJumpToSlide,
}: AcceleratorPreviewDotsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {slides.map((item, index) => (
        <Button
          key={`${item.id}-dot`}
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onJumpToSlide(index)}
          className="relative h-2.5 w-8 rounded-full p-0 hover:bg-transparent"
          aria-label={`Go to ${item.tab}`}
          aria-current={activeSlide === index ? "true" : undefined}
        >
          <span className="absolute inset-0 rounded-full bg-muted" />
          {activeSlide === index ? (
            <motion.span
              layoutId="accelerator-slide-dot"
              className="absolute inset-0 rounded-full bg-foreground"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          ) : null}
        </Button>
      ))}
    </div>
  )
}
