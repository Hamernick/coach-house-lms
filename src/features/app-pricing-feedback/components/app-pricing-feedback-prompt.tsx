"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import { motion, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppPricingFeedbackController } from "../hooks/use-app-pricing-feedback-controller"
import type {
  AppPricingFeedbackPrompt as AppPricingFeedbackPromptState,
  AppPricingFeedbackSelection,
  AppPricingFeedbackTutorialKey,
} from "../types"

type AppPricingFeedbackPromptProps = {
  prompt: AppPricingFeedbackPromptState | null
  tutorial: AppPricingFeedbackTutorialKey
  tutorialPending: boolean
}

const BANNER_TOAST_ID_PREFIX = "app-pricing-feedback-banner"
const APP_PRICING_FEEDBACK_BANNER_WIDTH = "min(calc(100vw - 1.5rem), 60rem)"
const APP_PRICING_FEEDBACK_BANNER_TOAST_STYLE: CSSProperties = {
  left: "50%",
  width: APP_PRICING_FEEDBACK_BANNER_WIDTH,
  translate: "-50% 0",
  "--offset": "0px",
} as CSSProperties & Record<"--offset", string>

function AppPricingFeedbackBanner({
  prompt,
  error,
  isPending,
  showConfirmation,
  onSubmit,
}: {
  prompt: AppPricingFeedbackPromptState
  error: string | null
  isPending: boolean
  showConfirmation: boolean
  onSubmit: (selection: AppPricingFeedbackSelection) => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 18,
              scale: 0.985,
            }
      }
      animate={
        reduceMotion
          ? undefined
          : {
              opacity: 1,
              y: 0,
              scale: 1,
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.42,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      className={cn(
        "pointer-events-auto flex w-full flex-col gap-3 rounded-[24px] border border-border/70 bg-background/95 px-4 py-3 text-foreground shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6",
        "supports-[backdrop-filter]:bg-background/85",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-5 sm:text-[0.95rem]">
          <span className="font-semibold">{prompt.bannerEyebrow}</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-balance">
            {showConfirmation ? prompt.thankYouMessage : prompt.bannerMessage}
          </span>
        </div>
        {error ? (
          <p className="mt-1 text-xs font-medium text-destructive sm:text-sm">{error}</p>
        ) : null}
      </div>
      {showConfirmation ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckIcon />
        </div>
      ) : (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onSubmit("yes")}
            className="h-10 rounded-xl px-4 text-sm font-semibold"
          >
            {prompt.yesLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onSubmit("no")}
            className="h-10 rounded-xl px-4 text-sm font-semibold"
          >
            {prompt.noLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onSubmit("skip")}
            className="h-10 rounded-xl px-3 text-sm font-medium text-muted-foreground"
          >
            {prompt.skipLabel}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export function AppPricingFeedbackPrompt({
  prompt,
  tutorial,
  tutorialPending,
}: AppPricingFeedbackPromptProps) {
  const bannerToastIdRef = useRef<string | number | null>(null)
  const controller = useAppPricingFeedbackController({
    prompt,
    tutorial,
    tutorialPending,
  })

  useEffect(() => {
    if (!controller.bannerVisible || !prompt) {
      if (bannerToastIdRef.current !== null) {
        toast.dismiss(bannerToastIdRef.current)
        bannerToastIdRef.current = null
      }
      return
    }

    const toastId = bannerToastIdRef.current ?? `${BANNER_TOAST_ID_PREFIX}-${prompt.surveyKey}`
    bannerToastIdRef.current = toast.custom(
      () => (
        <AppPricingFeedbackBanner
          prompt={prompt}
          error={controller.error}
          isPending={controller.isPending}
          showConfirmation={controller.showConfirmation}
          onSubmit={controller.submit}
        />
      ),
      {
        id: toastId,
        position: "bottom-center",
        duration: Number.POSITIVE_INFINITY,
        dismissible: false,
        closeButton: false,
        style: APP_PRICING_FEEDBACK_BANNER_TOAST_STYLE,
      },
    )
  }, [
    controller.bannerVisible,
    controller.error,
    controller.isPending,
    controller.showConfirmation,
    controller.submit,
    prompt,
  ])

  useEffect(() => {
    return () => {
      if (bannerToastIdRef.current !== null) {
        toast.dismiss(bannerToastIdRef.current)
        bannerToastIdRef.current = null
      }
    }
  }, [])

  if (!prompt) return null
  return null
}
