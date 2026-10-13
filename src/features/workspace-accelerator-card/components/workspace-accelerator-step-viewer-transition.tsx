"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

export function WorkspaceAcceleratorStepViewerTransition({
  children,
  open,
}: {
  children: ReactNode
  open: boolean
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open ? (
        <motion.div
          key="accelerator-step-viewer"
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, transform: "translate3d(10px, 0, 0) scale(0.992)" }
          }
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: "translate3d(6px, 0, 0) scale(0.996)" }
          }
          transition={{
            duration: prefersReducedMotion ? 0 : 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex h-full min-h-0 will-change-transform"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
