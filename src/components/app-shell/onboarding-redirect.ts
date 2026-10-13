import { FIND_PATH } from "@/lib/find/routes"

const WORKSPACE_ONBOARDING_REDIRECT = "/onboarding?source=onboarding"
const MEMBER_ONBOARDING_REDIRECT = `${FIND_PATH}?member_onboarding=1&source=onboarding`

function isFindPath(pathname: string) {
  return pathname === FIND_PATH || pathname.startsWith(`${FIND_PATH}/`)
}

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
  if (redirectTarget === MEMBER_ONBOARDING_REDIRECT && isFindPath(pathname)) {
    return null
  }
  if (redirectTarget === WORKSPACE_ONBOARDING_REDIRECT && pathname.startsWith("/onboarding")) return null
  return redirectTarget
}
