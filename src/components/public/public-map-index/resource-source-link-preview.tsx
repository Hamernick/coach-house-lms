"use client"

import { useState } from "react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"

type SourceLinkPreviewMetadata = {
  description?: string | null
  image?: string | null
  title?: string | null
}

type SourceLinkPreviewState =
  | { status: "idle" | "loading"; metadata: null }
  | { status: "ready"; metadata: SourceLinkPreviewMetadata | null }

function resolveSourceHostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./i, "")
  } catch {
    return href
  }
}

function resolveSourcePreviewImage(href: string, value?: string | null) {
  if (!value) return null
  try {
    const imageUrl = new URL(value, href)
    return ["http:", "https:"].includes(imageUrl.protocol)
      ? imageUrl.toString()
      : null
  } catch {
    return null
  }
}

export function PublicMapResourceSourceLinkPreview({
  href,
  label,
}: {
  href: string
  label: string
}) {
  const [preview, setPreview] = useState<SourceLinkPreviewState>({
    status: "idle",
    metadata: null,
  })
  const hostname = resolveSourceHostname(href)
  const imageSrc = resolveSourcePreviewImage(href, preview.metadata?.image)

  function loadPreview() {
    if (preview.status !== "idle") return
    setPreview({ status: "loading", metadata: null })
    void fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Preview unavailable")
        return (await response.json()) as SourceLinkPreviewMetadata
      })
      .then((metadata) => setPreview({ status: "ready", metadata }))
      .catch(() => setPreview({ status: "ready", metadata: null }))
  }

  return (
    <HoverCard
      openDelay={160}
      closeDelay={100}
      onOpenChange={(open) => {
        if (open) loadPreview()
      }}
    >
      <HoverCardTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={href}
          className="decoration-border hover:decoration-foreground focus-visible:ring-ring/50 inline-flex max-w-full min-w-0 items-center gap-1 underline underline-offset-2 transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="min-w-0 break-words">{label}</span>
          <ExternalLinkIcon className="size-3 shrink-0" aria-hidden />
        </a>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-72 overflow-hidden rounded-xl p-0"
      >
        {preview.status === "loading" ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : (
          <>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                loading="lazy"
                className="border-border/60 aspect-[120/63] w-full border-b object-cover"
              />
            ) : null}
            <div className="flex flex-col gap-1.5 p-3">
              <p className="line-clamp-2 text-sm font-semibold">
                {preview.metadata?.title || label}
              </p>
              <p className="text-muted-foreground line-clamp-3 text-xs">
                {preview.metadata?.description ||
                  `Open the original source on ${hostname}.`}
              </p>
              <p className="text-muted-foreground truncate text-[11px]">
                {hostname}
              </p>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
