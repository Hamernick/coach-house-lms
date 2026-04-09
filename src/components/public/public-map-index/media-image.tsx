"use client"

import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type PublicMapMediaImageProps = {
  alt: string
  className?: string
  loading?: "eager" | "lazy"
  src: string
  wrapperClassName?: string
}

export function PublicMapMediaImage({
  alt,
  className,
  loading = "lazy",
  src,
  wrapperClassName,
}: PublicMapMediaImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {!loaded && !errored ? (
        <Skeleton className="absolute inset-0 bg-muted/45" aria-hidden />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300 ease-out",
          loaded && !errored ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true)
          setLoaded(false)
        }}
      />
      {errored ? <div className="absolute inset-0 bg-muted/25" aria-hidden /> : null}
    </div>
  )
}
