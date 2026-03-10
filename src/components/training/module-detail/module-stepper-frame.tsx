import { motion } from "framer-motion"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type ModuleStepperFrameProps = {
  children: ReactNode
  scrollable?: boolean
  padded?: boolean
  fitContent?: boolean
}

export function ModuleStepperFrame({
  children,
  scrollable = false,
  padded = false,
  fitContent = false,
}: ModuleStepperFrameProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm",
          fitContent ? "" : "aspect-[4/5] sm:aspect-[16/9]",
        )}
      >
        <div
          className={cn(
            fitContent ? "w-full" : "h-full w-full",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
            padded ? "p-6" : "",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function ModuleStepperCelebrationIcon() {
  return (
    <motion.span
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-400 text-white shadow-sm"
      initial={{ scale: 0.8, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Sparkles className="h-5 w-5 text-white" />
    </motion.span>
  )
}
