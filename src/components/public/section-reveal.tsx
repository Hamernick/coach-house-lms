"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type SectionRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function SectionReveal({ children, className, delay = 0 }: SectionRevealProps) {
  const ref = React.useRef<HTMLElement | null>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      data-state={visible ? "visible" : "hidden"}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "snap-start scroll-mt-24 py-24 md:py-32 will-change-transform",
        "transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        "opacity-0 translate-y-10 scale-[0.96] data-[state=visible]:opacity-100 data-[state=visible]:translate-y-0 data-[state=visible]:scale-100",
        className,
      )}
    >
      {children}
    </section>
  )
}
