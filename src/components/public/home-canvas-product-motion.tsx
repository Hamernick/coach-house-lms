"use client"

import { gsap } from "gsap"
import { useLayoutEffect, useRef, type ReactNode } from "react"

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function shouldReduceMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function HomeCanvasHeroMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || shouldReduceMotion()) return

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-home-canvas-hero-media]",
        { autoAlpha: 0.72, scale: 1.06 },
        {
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
          scale: 1,
        }
      )
      gsap.fromTo(
        "[data-home-canvas-hero-copy] > *",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          duration: 0.62,
          ease: "power3.out",
          stagger: 0.07,
          y: 0,
        }
      )
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div ref={rootRef} className="h-full min-h-0 w-full">
      {children}
    </div>
  )
}

export function HomeCanvasRevealMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || shouldReduceMotion()) return

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-home-canvas-reveal]")
    )
    if (elements.length === 0) return

    gsap.set(elements, { autoAlpha: 0, y: 24 })

    const reveal = (element: HTMLElement) => {
      gsap.to(element, {
        autoAlpha: 1,
        duration: 0.58,
        ease: "power3.out",
        overwrite: "auto",
        y: 0,
      })
    }

    if (typeof IntersectionObserver === "undefined") {
      elements.forEach(reveal)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          observer.unobserve(entry.target)
          reveal(entry.target as HTMLElement)
        })
      },
      { threshold: 0.12 }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="h-full min-h-full w-full">
      {children}
    </div>
  )
}
