"use client"

import { memo } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { particleSourceKey } from "../lib"
import type { ParticleSource } from "../types"
import { useWorkspaceParticles } from "./particle-context"
import { ParticlePreview } from "./particle-preview"
import { ParticleSourceHandle } from "./particle-source-handle"

export const ParticleTile = memo(function ParticleTile({
  source,
}: {
  source: ParticleSource
}) {
  const controller = useWorkspaceParticles()
  const placed =
    Boolean(source.canvasNodeId) ||
    controller?.state.items.some(
      (item) => particleSourceKey(item.source) === particleSourceKey(source.ref)
    )
  return (
    <Card className="hover:border-foreground/20 focus-within:border-foreground/25 gap-0 overflow-hidden rounded-[14px] py-0 shadow-none">
      <CardHeader className="gap-0 px-2.5 py-2">
        <div className="flex min-w-0 items-start justify-between gap-1">
          <CardTitle
            className="min-w-0 truncate py-1 text-xs leading-5"
            title={source.title}
          >
            {source.title}
          </CardTitle>
          {source.available ? (
            <ParticleSourceHandle
              source={source.ref}
              title={source.title}
              className="-m-1 size-8 transition-none"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="bg-muted/25 relative m-1 mt-0 grid h-28 place-items-center overflow-hidden rounded-[10px] p-0 outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10">
        {controller?.canEdit && source.available ? (
          <ParticleSourceHandle
            source={source.ref}
            title={source.title}
            className="absolute inset-0 h-full w-full rounded-[10px] p-0 transition-none hover:bg-transparent focus-visible:ring-inset"
          >
            <span aria-hidden className="block size-full">
              <ParticlePreview source={source} />
            </span>
          </ParticleSourceHandle>
        ) : (
          <ParticlePreview source={source} />
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="bg-background/90 hover:bg-background absolute right-1.5 bottom-1.5 z-10 size-8 rounded-[8px] border shadow-xs backdrop-blur-sm transition-none"
          disabled={!controller?.canEdit || !source.available}
          aria-label={
            placed
              ? `Show ${source.title} on canvas`
              : `Add ${source.title} to canvas`
          }
          onClick={() => controller?.add(source.ref)}
        >
          {placed ? <CheckIcon /> : <PlusIcon />}
        </Button>
      </CardContent>
      <CardDescription className="line-clamp-2 min-h-10 px-2.5 pt-1 pb-2.5 text-[11px] leading-4">
        {source.description}
      </CardDescription>
    </Card>
  )
})
