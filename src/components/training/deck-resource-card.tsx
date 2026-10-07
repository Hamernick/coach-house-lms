"use client"

import { DeckViewer } from "@/components/training/module-detail/deck-viewer"
import { cn } from "@/lib/utils"

type DeckResourceCardProps = {
  moduleId: string
  hasDeck: boolean
  variant?: "grid" | "stacked"
  className?: string
}

export function DeckResourceCard({
  moduleId,
  hasDeck,
  variant = "grid",
  className,
}: DeckResourceCardProps) {
  if (!hasDeck) return null

  const baseClass =
    variant === "grid" ? "w-full max-w-[260px] aspect-square" : "w-full min-w-0 min-h-[220px] shadow-none hover:shadow-none"

  return (
    <DeckViewer
      moduleId={moduleId}
      hasDeck={hasDeck}
      variant="card"
      className={cn(baseClass, className)}
      openExternally
    />
  )
}
