"use client"

import * as React from "react"
import { motion, useScroll, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

type ScrollTextRevealProps = {
  words: string
  className?: string
  wordClassName?: string
  offset?: [string, string]
}

type ProgressValue = ReturnType<typeof useScroll>["scrollYProgress"]

type WordProps = {
  word: string
  index: number
  total: number
  progress: ProgressValue
  className?: string
}

function RevealWord({ word, index, total, progress, className }: WordProps) {
  const start = index / total
  const end = (index + 1) / total
  const opacity = useTransform(progress, [start, end], [0, 1])
  const y = useTransform(progress, [start, end], [10, 0])

  return (
    <motion.span
      style={{ opacity, y }}
      className={cn("inline-block", className)}
    >
      {word}
    </motion.span>
  )
}

export function ScrollTextReveal({
  words,
  className,
  wordClassName,
  offset = ["start 80%", "center center"],
}: ScrollTextRevealProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null)
  const containerRef = React.useRef<HTMLElement | null>(null)
  const wordList = React.useMemo(() => words.split(" "), [words])

  const resolveScrollParent = React.useCallback((node: HTMLElement | null) => {
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
  }, [])

  const setRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      ref.current = node
      if (!node) return
      if (!containerRef.current) {
        containerRef.current = resolveScrollParent(node)
      }
    },
    [resolveScrollParent],
  )

  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset,
  })

  return (
    <span ref={setRef} className={cn("inline-block", className)}>
      <span className="sr-only">{words}</span>
      <span aria-hidden className="inline-block">
        {wordList.map((word, index) => (
          <RevealWord
            key={`${word}-${index}`}
            word={index < wordList.length - 1 ? `${word}\u00A0` : word}
            index={index}
            total={wordList.length}
            progress={scrollYProgress}
            className={wordClassName}
          />
        ))}
      </span>
    </span>
  )
}
