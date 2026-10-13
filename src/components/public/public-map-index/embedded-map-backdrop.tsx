"use client"

import { useEffect, useRef, type RefObject } from "react"

import { cn } from "@/lib/utils"

import { PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME } from "./sidebar-theme"

export function PublicMapEmbeddedBackdrop({
  screenRef,
  contentRef,
}: {
  screenRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
}) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const screen = screenRef.current
    const backdrop = backdropRef.current
    const fade = fadeRef.current
    const content = contentRef.current
    const page = screen?.closest("main")
    if (!screen || !backdrop || !fade || !page || !content) return

    let frame = 0
    let backgroundTail = 192
    let previousGeometry = ""
    const updateCutout = () => {
      frame = 0
      const bounds = screen.getBoundingClientRect()
      const pageBounds = page.getBoundingClientRect()
      const scrollTop = page.scrollTop
      const x = bounds.left - pageBounds.left + 1
      const y = bounds.top - pageBounds.top + scrollTop + 1
      const right = bounds.right - pageBounds.left - 1
      const bottom = bounds.bottom - pageBounds.top + scrollTop - 1
      const geometry = [page.clientWidth, page.clientHeight, x, y, right, bottom].join(":")
      if (geometry === previousGeometry) return
      previousGeometry = geometry
      const guides = content.querySelector("[data-public-map-background-fade-start]")
      if (guides) {
        backgroundTail = Math.max(0, guides.getBoundingClientRect().bottom - bounds.bottom)
      }
      const fadeStart = bottom + 1 + backgroundTail
      const height = fadeStart + 320
      const radius = 23
      // All layers share content coordinates: scrolling needs no layout reads/writes.
      backdrop.style.height = `${height + 2}px`
      fade.style.top = `${fadeStart}px`
      // An even-odd clip leaves a rounded hole in both the blur and hit area.
      const path = [
        `M0 0H${page.clientWidth}V${height + 2}H0Z`,
        `M${x + radius} ${y}H${right - radius}`,
        `A${radius} ${radius} 0 0 1 ${right} ${y + radius}V${bottom - radius}`,
        `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}H${x + radius}`,
        `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}V${y + radius}`,
        `A${radius} ${radius} 0 0 1 ${x + radius} ${y}Z`,
      ].join(" ")
      backdrop.style.clipPath = `path(evenodd, "${path}")`
    }
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateCutout)
    }

    updateCutout()
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(screen)
    observer.observe(page)
    // Keep the blur and fade extent stable across results, tabs and pagination.
    window.addEventListener("resize", scheduleUpdate)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", scheduleUpdate)
    }
  }, [screenRef, contentRef])

  return (
    <>
    <div
      ref={backdropRef}
      data-public-map-backdrop=""
      aria-hidden="true"
      className={cn(
        PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
        "pointer-events-auto absolute inset-x-0 top-0 z-10 h-full border-0"
      )}
    />
    <div
      ref={fadeRef}
      data-public-map-background-fade=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-96 bg-linear-to-b from-transparent via-background/50 to-background to-80%"
    />
    </>
  )
}
