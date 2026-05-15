"use client"

import { useCallback, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import BookOpenCheckIcon from "lucide-react/dist/esm/icons/book-open-check"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { PublicMapMemberOnboardingOverlay } from "./member-onboarding-overlay"
import {
  buildPublicMapMemberOnboardingPreviewHref,
  isPublicMapMemberOnboardingPreviewActive,
} from "./member-onboarding-preview"

export type PublicMapMemberOnboardingConfig = {
  enabled: boolean
  intentFocus: "find" | "fund" | "support" | null
  hasOrganizationSwitcher: boolean
  onComplete: (form: FormData) => Promise<void>
}

export type PublicMapAdminOnboardingPreviewConfig = {
  canToggle: boolean
  hasOrganizationSwitcher: boolean
}

export function usePublicMapMemberOnboardingMapOverlay({
  isAuthenticated,
  memberOnboarding,
  adminOnboardingPreview,
}: {
  isAuthenticated: boolean
  memberOnboarding?: PublicMapMemberOnboardingConfig
  adminOnboardingPreview?: PublicMapAdminOnboardingPreviewConfig
}): ReactNode {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const realMemberOnboardingEnabled = isAuthenticated && Boolean(memberOnboarding?.enabled)
  const adminOnboardingPreviewEnabled =
    isAuthenticated &&
    !realMemberOnboardingEnabled &&
    isPublicMapMemberOnboardingPreviewActive({
      canPreview: Boolean(adminOnboardingPreview?.canToggle),
      memberOnboardingParam: searchParams.get("member_onboarding"),
    })
  const showMemberOnboardingOverlay =
    realMemberOnboardingEnabled || adminOnboardingPreviewEnabled
  const handleToggleAdminOnboardingPreview = useCallback(
    (enabled: boolean) => {
      router.replace(
        buildPublicMapMemberOnboardingPreviewHref({
          pathname,
          searchParams,
          enabled,
        }),
        { scroll: false },
      )
    },
    [pathname, router, searchParams],
  )
  const adminPreviewToggle =
    isAuthenticated && adminOnboardingPreview?.canToggle ? (
      <PublicMapMemberOnboardingPreviewToggle
        active={adminOnboardingPreviewEnabled}
        onToggle={() => handleToggleAdminOnboardingPreview(!adminOnboardingPreviewEnabled)}
      />
    ) : null
  const memberOnboardingOverlay = showMemberOnboardingOverlay ? (
    adminOnboardingPreviewEnabled && adminOnboardingPreview ? (
      <PublicMapMemberOnboardingOverlay
        intentFocus="find"
        hasOrganizationSwitcher={adminOnboardingPreview.hasOrganizationSwitcher}
        onDismiss={() => handleToggleAdminOnboardingPreview(false)}
      />
    ) : memberOnboarding ? (
      <PublicMapMemberOnboardingOverlay
        intentFocus={memberOnboarding.intentFocus}
        hasOrganizationSwitcher={memberOnboarding.hasOrganizationSwitcher}
        onSubmit={memberOnboarding.onComplete}
      />
    ) : null
  ) : null

  return adminPreviewToggle || memberOnboardingOverlay ? (
    <>
      {adminPreviewToggle}
      {memberOnboardingOverlay}
    </>
  ) : null
}

function PublicMapMemberOnboardingPreviewToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-30">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={active}
        className="pointer-events-auto rounded-xl border-border/70 bg-card/92 shadow-sm backdrop-blur"
        onClick={onToggle}
      >
        {active ? (
          <XIcon data-icon="inline-start" aria-hidden />
        ) : (
          <BookOpenCheckIcon data-icon="inline-start" aria-hidden />
        )}
        {active ? "Hide intro" : "Preview intro"}
      </Button>
    </div>
  )
}
