"use client"

import type { ParticleSource } from "../types"
import { googleParticleUrl } from "../lib"
import { ParticleRoadmapContent } from "./particle-roadmap-content"
import { ParticleImageDisplay, ParticleIcon } from "./particle-preview"

export function ParticleContent({
  source,
  large,
  selected,
}: {
  source: ParticleSource | undefined
  large: boolean
  selected: boolean
}) {
  if (!source || !source.available)
    return (
      <p className="text-muted-foreground p-4 text-sm">
        This source is unavailable. Check its access or remove it from the
        canvas.
      </p>
    )
  if (source.image)
    return <ParticleImageDisplay source={source} className="rounded-lg" />
  if (source.document) {
    const preview = googleParticleUrl(source.document, "preview")
    return large && selected && preview ? (
      <iframe
        title={`${source.title} preview`}
        src={preview}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-full rounded-lg border-0"
        allow="fullscreen"
      />
    ) : (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <ParticleIcon kind="drive" className="size-10" />
        <p className="text-xs">
          {large
            ? "Select to preview. Open in Google if sign-in is required."
            : "Google Drive"}
        </p>
      </div>
    )
  }
  return source.section ? (
    <ParticleRoadmapContent section={source.section} />
  ) : null
}
