"use client"

import { useRef, type ReactNode } from "react"

import { PublicMapEmbeddedBackdrop } from "./embedded-map-backdrop"
import { PublicMapFooter } from "./footer"
import { usePublicMapPageScroll } from "./use-public-map-page-scroll"

export function PublicMapEmbeddedLayout({
  contentActive = false,
  map,
  panel,
  toolbar,
}: {
  contentActive?: boolean
  map: ReactNode
  panel: ReactNode
  toolbar: ReactNode
}) {
  const screenRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  usePublicMapPageScroll(contentRef)

  // Keep the map inside the established screen; surrounding glass stays separate.
  return (
    <div ref={contentRef} className="pointer-events-none mx-auto flex w-full max-w-5xl min-w-0 flex-col items-center gap-2">
      <PublicMapEmbeddedBackdrop screenRef={screenRef} contentRef={contentRef} />
      <div className="w-full shrink-0">
        <div data-public-map-toolbar="" className="relative z-20 mb-1 flex h-11 items-center justify-between gap-3 sm:h-8">
          {toolbar}
        </div>
        {/* Keep the map above the surrounding blur so its edges cannot bleed into it. */}
        <div
          ref={screenRef}
          data-public-map-screen=""
          data-public-map-screen-mode={contentActive ? "content" : "map"}
          className="relative z-20 aspect-[4/5] max-h-[60svh] w-full rounded-3xl sm:aspect-video sm:max-h-[70svh] lg:max-h-none"
        >
          <div className="absolute inset-0">{map}</div>
          <div aria-hidden="true" className="border-border pointer-events-none absolute inset-0 z-[60] rounded-3xl border" />
        </div>
      </div>
      <div className="pointer-events-auto relative z-20 flex w-full max-w-xl min-w-0 flex-col pt-2">
        {panel}
      </div>
      <div className="pointer-events-auto relative z-20 w-full"><PublicMapFooter showEmptySection /></div>
    </div>
  )
}
