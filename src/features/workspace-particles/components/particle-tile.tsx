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
    <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-none">
      <CardHeader className="gap-1 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-start justify-between gap-1">
          <CardTitle
            className="min-w-0 truncate text-sm leading-7"
            title={source.title}
          >
            {source.title}
          </CardTitle>
          {source.available ? (
            <ParticleSourceHandle source={source.ref} title={source.title} />
          ) : null}
        </div>
        <CardDescription className="line-clamp-2 min-h-10 text-xs leading-5">
          {source.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-background/70 relative m-1 mt-0 grid h-40 place-items-center rounded-xl border p-4">
        {controller?.canEdit && source.available ? (
          <ParticleSourceHandle
            source={source.ref}
            title={source.title}
            className="absolute inset-0 h-full w-full rounded-xl p-4 hover:bg-transparent"
          >
            <ParticlePreview source={source} />
          </ParticleSourceHandle>
        ) : (
          <ParticlePreview source={source} />
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-2 bottom-2 size-9"
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
    </Card>
  )
})
