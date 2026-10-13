import { getSafeRedirectPath } from "@/lib/auth/redirects"
import {
  resolveSignupBuilderPlanTier,
  resolveSignupIntentFocus,
  type SignupBuilderPlanTier,
  type SignupIntentFocus,
} from "@/lib/onboarding/signup-plan"

import {
  CANVAS_NAV,
  resolveSectionAlias,
  type CanvasSectionId,
} from "./home-canvas-preview-config"

export type HomeCanvasSectionLinkTarget = {
  href: string
  loginRedirectTo?: string
  section: CanvasSectionId
  signupIntentFocus: SignupIntentFocus | null
  signupPlanTier: SignupBuilderPlanTier | null
}

function normalizeCanvasPath(pathname: string) {
  return pathname === "/home-canvas" ? "/" : pathname
}

function resolveCanvasSection(value: string | null): CanvasSectionId | null {
  if (!value) return null
  const aliasMatch = resolveSectionAlias(value)
  if (aliasMatch) return aliasMatch
  const directMatch = CANVAS_NAV.find((item) => item.id === value)
  return directMatch?.id ?? null
}

export function resolveHomeCanvasSectionLinkTarget({
  currentHref,
  href,
}: {
  currentHref: string
  href: string
}): HomeCanvasSectionLinkTarget | null {
  let currentUrl: URL
  let targetUrl: URL

  try {
    currentUrl = new URL(currentHref)
    targetUrl = new URL(href, currentUrl)
  } catch {
    return null
  }

  if (targetUrl.origin !== currentUrl.origin) return null

  const currentPath = normalizeCanvasPath(currentUrl.pathname)
  const targetPath = normalizeCanvasPath(targetUrl.pathname)
  if (currentPath !== "/" || targetPath !== "/") return null

  const section = resolveCanvasSection(targetUrl.searchParams.get("section"))
  if (!section) return null

  return {
    href: `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
    loginRedirectTo: getSafeRedirectPath(targetUrl.searchParams.get("redirect")),
    section,
    signupIntentFocus: resolveSignupIntentFocus(
      targetUrl.searchParams.get("intent"),
    ),
    signupPlanTier: resolveSignupBuilderPlanTier(
      targetUrl.searchParams.get("plan"),
    ),
  }
}
