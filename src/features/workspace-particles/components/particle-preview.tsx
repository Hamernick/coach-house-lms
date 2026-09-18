"use client"

import { useState } from "react"
import ActivityIcon from "lucide-react/dist/esm/icons/activity"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import ImageIcon from "lucide-react/dist/esm/icons/image"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import { cn } from "@/lib/utils"
import { particleImageUrl } from "../lib"
import type { ParticleKind, ParticleSource } from "../types"

export function ParticleIcon({
  kind,
  className,
}: {
  kind: ParticleKind
  className?: string
}) {
  const Icon =
    kind === "organization"
      ? Building2Icon
      : kind === "activity"
        ? ActivityIcon
        : kind === "plan"
          ? TargetIcon
          : kind === "image"
            ? ImageIcon
            : kind === "drive"
              ? FileTextIcon
              : RouteIcon
  return <Icon aria-hidden className={cn("size-5 shrink-0", className)} />
}

export function ParticleImageDisplay({
  source,
  className,
}: {
  source: ParticleSource
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!source.image || failed)
    return (
      <div className="text-muted-foreground grid h-full place-items-center p-4 text-center text-xs">
        Image unavailable
      </div>
    )
  // Private, authenticated endpoint; bypass the public Next image optimizer.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={particleImageUrl(source.image)}
      alt={source.title}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("size-full object-contain", className)}
    />
  )
}

export function ParticlePreview({ source }: { source: ParticleSource }) {
  if (source.ref.kind === "image")
    return <ParticleImageDisplay source={source} className="rounded-lg" />
  return (
    <div
      aria-hidden
      className="bg-muted/40 flex w-32 flex-col gap-3 rounded-xl border p-4"
    >
      <ParticleIcon
        kind={source.ref.kind}
        className="text-muted-foreground mb-1"
      />
      <div className="bg-foreground/20 h-1.5 w-2/3 rounded-full" />
      <div className="bg-foreground/10 h-1.5 w-full rounded-full" />
      <div className="bg-foreground/10 h-1.5 w-4/5 rounded-full" />
      <div className="bg-foreground/80 mt-2 h-4 w-full rounded-md" />
    </div>
  )
}
