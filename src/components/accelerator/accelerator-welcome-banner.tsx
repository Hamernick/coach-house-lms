"use client"

import { useEffect, useMemo, useState } from "react"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AcceleratorWelcomeBannerProps = {
  userId: string
  className?: string
}

const BANNER_VERSION = "v1"

export function AcceleratorWelcomeBanner({ userId, className }: AcceleratorWelcomeBannerProps) {
  const storageKey = useMemo(
    () => `accelerator-overview-welcome-dismissed:${BANNER_VERSION}:${userId}`,
    [userId],
  )
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(storageKey) === "1"
      setIsVisible(!dismissed)
    } catch {
      setIsVisible(true)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      window.localStorage.setItem(storageKey, "1")
    } catch {
      // ignore storage failures and still hide in-memory
    }
  }

  if (!isVisible) return null

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-zinc-100/80 px-4 py-4 dark:bg-zinc-900/30 sm:px-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
              <RocketIcon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Welcome</p>
              <h1 className="text-balance text-xl font-semibold text-foreground sm:text-2xl">
                Idea to Impact Accelerator
              </h1>
            </div>
          </div>
          <div className="mt-3 max-w-[68ch] space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Welcome to the idea to impact nonprofit accelerator. We built this from 25+ years of experience
              developing nonprofits to help you build yours.
            </p>
            <p>
              This is designed to help you rapidly build the core foundations of your organization, step by step, and
              leave with a clear, sustainable plan to launch, fund, and grow.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg border border-border/70 bg-background/80 hover:bg-background"
          onClick={handleDismiss}
          aria-label="Dismiss welcome banner"
        >
          <XIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </section>
  )
}
