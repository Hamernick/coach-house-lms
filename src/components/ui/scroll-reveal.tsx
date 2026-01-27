"use client"

import { useEffect, useMemo, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

type ScrollRevealProps = {
  children: string
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
  rotationEnd?: string
  wordAnimationEnd?: string
}

export function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName,
  textClassName,
  rotationEnd = "bottom 40%",
  wordAnimationEnd = "bottom 40%",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null)

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : ""
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word
      return (
        <span className="word inline-block" data-scroll-reveal-word key={index}>
          {word}
        </span>
      )
    })
  }, [children])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const words = el.querySelectorAll<HTMLElement>("[data-scroll-reveal-word]")
      words.forEach((word) => {
        word.style.opacity = "1"
        word.style.filter = "blur(0px)"
      })
      return
    }

    const resolveScrollParent = (node: HTMLElement | null) => {
      if (!node) return null
      let parent: HTMLElement | null = node.parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        const isScrollable = /(auto|scroll)/.test(style.overflowY)
        if (isScrollable && parent.scrollHeight > parent.clientHeight) {
          return parent
        }
        parent = parent.parentElement
      }
      return node.ownerDocument?.documentElement ?? null
    }

    const scroller = scrollContainerRef?.current ?? resolveScrollParent(el) ?? undefined
    const wordElements = el.querySelectorAll<HTMLElement>("[data-scroll-reveal-word]")

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: "0% 50%", rotate: baseRotation, opacity: 0.9 },
        {
          ease: "none",
          rotate: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: "top 90%",
            end: rotationEnd,
            scrub: true,
          },
        },
      )

      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          ease: "none",
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: "top 90%",
            end: wordAnimationEnd,
            scrub: true,
          },
        },
      )

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: "none",
            filter: "blur(0px)",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: "top bottom-=20%",
              end: wordAnimationEnd,
              scrub: true,
            },
          },
        )
      }
    }, el)

    return () => ctx.revert()
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength])

  return (
    <h2 ref={containerRef} className={cn("scroll-reveal", containerClassName)}>
      <span className={cn("scroll-reveal-text", textClassName)}>{splitText}</span>
    </h2>
  )
}
