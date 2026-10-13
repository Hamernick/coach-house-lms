"use client"

import { useRef, type ReactNode } from "react"

import { PublicMapEmbeddedBackdrop } from "./embedded-map-backdrop"
import { usePublicMapPageScroll } from "./use-public-map-page-scroll"
import { EmbeddedProfileActiveContext } from "./embedded-profile"

export function PublicMapEmbeddedLayout({
  contentActive = false,
  map,
  panel,
  toolbar,
  profile,
}: {
  contentActive?: boolean
  map: ReactNode
  panel: ReactNode
  toolbar: ReactNode
  profile?: ReactNode
}) {
  const screenRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  usePublicMapPageScroll(contentRef)

  // Keep the map inside the established screen; surrounding glass stays separate.
  return (
    <EmbeddedProfileActiveContext.Provider value={contentActive}>
    <div ref={contentRef} className="pointer-events-none mx-auto flex w-full max-w-5xl min-w-0 flex-col items-center gap-2">
      <PublicMapEmbeddedBackdrop screenRef={screenRef} contentRef={contentRef} screenVisible={!contentActive} />
      <div aria-hidden={contentActive || undefined} inert={contentActive || undefined} className={contentActive ? "pointer-events-none invisible h-0 w-full overflow-hidden" : "w-full max-w-3xl shrink-0"}>
        <div data-public-map-toolbar="" className="relative z-20 mb-1 flex h-11 items-center justify-between gap-3 sm:h-8">
          {toolbar}
        </div>
        <div data-public-map-explorer="" className="flex min-w-0 flex-col items-center gap-4">
          {/* Keep the map above the surrounding blur so its edges cannot bleed into it. */}
          <div
            ref={screenRef}
            data-public-map-screen=""
            data-public-map-screen-mode={contentActive ? "content" : "map"}
            className="relative z-20 aspect-video w-full min-w-0 rounded-3xl"
          >
            <div className="absolute inset-0">{map}</div>
            <div aria-hidden="true" className="border-border pointer-events-none absolute inset-0 z-[60] rounded-3xl border" />
          </div>
        </div>
      </div>
      {contentActive ? profile : null}
      <div data-public-map-explorer-panel="" className={`pointer-events-auto relative z-20 flex w-full max-w-3xl min-h-0 min-w-0 flex-col ${contentActive ? "h-0" : ""}`}>
        {panel}
      </div>
    </div>
    </EmbeddedProfileActiveContext.Provider>
  )
}
