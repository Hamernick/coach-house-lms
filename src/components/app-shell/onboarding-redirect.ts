const WORKSPACE_ONBOARDING_REDIRECT = "/workspace?onboarding_flow=1&source=onboarding"
const MEMBER_ONBOARDING_REDIRECT = "/find?member_onboarding=1&source=onboarding"

export function resolveAppShellOnboardingRedirectTarget({
  onboardingLocked,
  onboardingIntentFocus,
  isAdminContext,
  pathname,
}: {
  onboardingLocked: boolean
  onboardingIntentFocus?: "build" | "find" | "fund" | "support" | null
  isAdminContext: boolean
  pathname: string | null
}) {
  if (!onboardingLocked || isAdminContext) return null
  const redirectTarget =
    onboardingIntentFocus === "find" ||
    onboardingIntentFocus === "fund" ||
    onboardingIntentFocus === "support"
      ? MEMBER_ONBOARDING_REDIRECT
      : WORKSPACE_ONBOARDING_REDIRECT
  if (typeof pathname !== "string" || pathname.length === 0) {
    return redirectTarget
  }
  if (redirectTarget === MEMBER_ONBOARDING_REDIRECT && pathname.startsWith("/find")) return null
  if (redirectTarget === WORKSPACE_ONBOARDING_REDIRECT && pathname.startsWith("/workspace")) return null
  return redirectTarget
}
