"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type FlipWordsProps = {
  words: string[]
  duration?: number
  className?: string
}

export function FlipWords({ words, duration = 2400, className }: FlipWordsProps) {
  const safeWords = React.useMemo(() => words.filter((word) => word.trim().length > 0), [words])
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    if (safeWords.length <= 1) return
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeWords.length)
    }, duration)
    return () => window.clearInterval(id)
  }, [duration, safeWords])

  if (safeWords.length === 0) return null
  const word = safeWords[index % safeWords.length]

  return (
    <span
      className={cn(
        "relative inline-flex h-[1em] min-w-[13ch] items-center justify-start align-baseline",
        className,
      )}
      aria-live="polite"
    >
      <span
        key={word}
        className="block whitespace-nowrap motion-safe:animate-[flip-word-in_350ms_ease-out_both]"
      >
        {word}
      </span>
    </span>
  )
}
