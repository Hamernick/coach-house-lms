"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useLayoutEffect, useRef, type ReactNode } from "react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

gsap.registerPlugin(ScrollTrigger)

export function HomeMarketplaceMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const context = gsap.context(() => {
      const intro = gsap.utils.toArray<HTMLElement>("[data-marketplace-intro]")
      const titleLines = gsap.utils.toArray<HTMLElement>(
        "[data-marketplace-hero-line]"
      )
      const hero = root.querySelector<HTMLElement>("[data-marketplace-hero]")
      const heroCopy = root.querySelector<HTMLElement>(
        "[data-marketplace-hero-copy]"
      )

      const entrance = gsap.timeline({
        defaults: { ease: "power4.out" },
      })
      entrance.fromTo(
        intro,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, duration: 0.7, stagger: 0.1, y: 0 }
      )
      entrance.fromTo(
        titleLines,
        { autoAlpha: 0, y: 64 },
        { autoAlpha: 1, duration: 0.9, stagger: 0.09, y: 0 },
        0.06
      )
      if (hero && heroCopy) {
        const heroScroll = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            scroller: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        heroScroll.to(
          heroCopy,
          { autoAlpha: 0.12, ease: "none", yPercent: -8 },
          0
        )
      }

      ScrollTrigger.refresh()
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      data-marketplace-scroll=""
      className="h-full min-h-0 w-full touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-none bg-[#006bff] [-webkit-overflow-scrolling:touch]"
    >
      {children}
    </div>
  )
}
