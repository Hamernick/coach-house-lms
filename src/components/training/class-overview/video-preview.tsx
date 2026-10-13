"use client"

import { useState } from "react"
import Image from "next/image"

import { AspectRatio } from "@/components/ui/aspect-ratio"

export function getYouTubeId(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()
    if (host.endsWith("youtube.com") || host.endsWith("m.youtube.com") || host.endsWith("www.youtube.com")) {
      const videoId = url.searchParams.get("v")
      if (videoId) return videoId
      const parts = url.pathname.split("/").filter(Boolean)
      const embedIndex = parts.findIndex((segment) => segment === "embed" || segment === "shorts")
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]
    }
    if (host.endsWith("youtu.be")) {
      const id = url.pathname.replace(/^\//, "").split("/")[0]
      return id || null
    }
  } catch {
    return null
  }
  return null
}

export function LazyYouTube({ id }: { id: string }) {
  const [play, setPlay] = useState(false)
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

  return (
    <div className="overflow-hidden rounded-lg border">
      <AspectRatio ratio={16 / 9}>
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Class video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            className="group relative h-full w-full"
            aria-label="Play video"
          >
            <Image
              src={thumb}
              alt="Video thumbnail"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              priority={false}
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30">
              <span className="inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-black">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </AspectRatio>
    </div>
  )
}
