"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TextGenerateEffectProps = {
  words: string
  className?: string
  wordClassName?: string
  delay?: number
  stagger?: number
  once?: boolean
}

export function TextGenerateEffect({
  words,
  className,
  wordClassName,
  delay = 0,
  stagger = 24,
  once = true,
}: TextGenerateEffectProps) {
  const [visible, setVisible] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement | null>(null)

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
          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  const wordList = React.useMemo(() => words.split(" "), [words])

  return (
    <span ref={ref} className={cn("inline-block", className)} data-state={visible ? "visible" : "hidden"}>
      <span className="sr-only">{words}</span>
      <span aria-hidden className="inline-block">
        {wordList.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={cn(
              "inline-block translate-y-2 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              visible && "translate-y-0 opacity-100",
              wordClassName,
            )}
            style={{ transitionDelay: `${delay + index * stagger}ms` }}
          >
            {index < wordList.length - 1 ? `${word}\u00A0` : word}
          </span>
        ))}
      </span>
    </span>
  )
}
