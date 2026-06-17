"use client"

import { useEffect, useState, type MouseEvent } from "react"

import { isPrimaryPlainNavigationIntent } from "./home-canvas-route-link-helpers"
import {
  resolveHomeCanvasSectionLinkTarget,
} from "./home-canvas-section-link"
import type { CanvasSectionId } from "./home-canvas-preview-config"
import type {
  SignupBuilderPlanTier,
  SignupIntentFocus,
} from "@/lib/onboarding/signup-plan"

export function useHomeCanvasSectionLinkController({
  changeSection,
  loginRedirectTo,
  signupIntentFocus,
  signupPlanTier,
}: {
  changeSection: (section: CanvasSectionId) => void
  loginRedirectTo?: string
  signupIntentFocus?: SignupIntentFocus | null
  signupPlanTier?: SignupBuilderPlanTier | null
}) {
  const [canvasLoginRedirectTo, setCanvasLoginRedirectTo] = useState(loginRedirectTo)
  const [canvasSignupIntentFocus, setCanvasSignupIntentFocus] = useState(signupIntentFocus ?? null)
  const [canvasSignupPlanTier, setCanvasSignupPlanTier] = useState(signupPlanTier ?? null)

  useEffect(() => {
    setCanvasLoginRedirectTo(loginRedirectTo)
    setCanvasSignupIntentFocus(signupIntentFocus ?? null)
    setCanvasSignupPlanTier(signupPlanTier ?? null)
  }, [loginRedirectTo, signupIntentFocus, signupPlanTier])

  function handleCanvasPanelClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof Element)) return
    const link = target.closest("a[href]")
    if (!(link instanceof HTMLAnchorElement)) return
    if (
      !isPrimaryPlainNavigationIntent({
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        metaKey: event.metaKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        target: link.target,
      })
    ) {
      return
    }

    const sectionTarget = resolveHomeCanvasSectionLinkTarget({
      currentHref: window.location.href,
      href: link.href,
    })
    if (!sectionTarget) return

    event.preventDefault()
    setCanvasLoginRedirectTo(sectionTarget.loginRedirectTo)
    setCanvasSignupIntentFocus(sectionTarget.signupIntentFocus)
    setCanvasSignupPlanTier(sectionTarget.signupPlanTier)
    window.history.replaceState(null, "", sectionTarget.href)
    changeSection(sectionTarget.section)
  }

  return {
    authPanelProps: {
      loginRedirectTo: canvasLoginRedirectTo,
      signupIntentFocus: canvasSignupIntentFocus,
      signupPlanTier: canvasSignupPlanTier,
    },
    handleCanvasPanelClick,
  }
}
