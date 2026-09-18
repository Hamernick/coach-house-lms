"use client"

import { useId, type ReactNode } from "react"
import { useDraggable } from "@dnd-kit/core"
import GripVerticalIcon from "lucide-react/dist/esm/icons/grip-vertical"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { particleSourceKey } from "../lib"
import type { ParticleReference } from "../types"
import { useWorkspaceParticles } from "./particle-context"

export function ParticleSourceHandle({
  source,
  title,
  className,
  children,
}: {
  source: ParticleReference
  title: string
  className?: string
  children?: ReactNode
}) {
  const controller = useWorkspaceParticles()
  const instance = useId()
  const key = particleSourceKey(source)
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `${instance}:${key}`,
    data: { sourceKey: key },
    disabled: !controller?.canEdit,
  })
  if (!controller?.canEdit) return null
  return (
    <Button
      ref={setNodeRef}
      type="button"
      variant="ghost"
      size="icon"
      {...attributes}
      {...listeners}
      data-vaul-no-drag
      data-particle-source={key}
      aria-label={`Drag ${title} to canvas, or press Enter to add`}
      title={`Drag ${title} to canvas`}
      className={cn(
        "nodrag nopan size-9 shrink-0 cursor-grab touch-none active:cursor-grabbing",
        className
      )}
      onClick={() => {
        controller.addFromSourceClick(source)
      }}
    >
      {children ?? <GripVerticalIcon />}
    </Button>
  )
}
