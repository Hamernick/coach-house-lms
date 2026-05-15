"use client"

import type { ReactNode } from "react"

import { LoginPanel } from "@/components/auth/login-panel"
import { SignUpForm } from "@/components/auth/sign-up-form"
import {
  LegacyHomeAcceleratorSection,
  LegacyHomeHeroSection,
  LegacyHomeOfferingsSection,
  LegacyHomeProcessSection,
  LegacyHomeTeamSection,
  type LegacyHomeSectionId,
} from "@/components/public/legacy-home-sections"
import { DEFAULT_POST_AUTH_REDIRECT } from "@/lib/auth/redirects"
import { FIND_PATH } from "@/lib/find/routes"
import {
  buildPostSignupBuilderRedirect,
  type SignupBuilderPlanTier,
  type SignupIntentFocus,
} from "@/lib/onboarding/signup-plan"

function CanvasPanelShell({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div
      className={
        centered
          ? "mx-auto grid min-h-full w-full max-w-[1100px] place-items-center px-4 py-6 md:px-6 lg:px-8"
          : "mx-auto flex min-h-full w-full max-w-[1100px] items-center px-4 py-6 md:px-6 lg:px-8"
      }
    >
      {children}
    </div>
  )
}

function getPlanLabel(planTier: SignupBuilderPlanTier | null) {
  if (planTier === "organization") return "Organization"
  if (planTier === "operations_support") return "Operations Support"
  if (planTier === "free") return "Individual"
  return null
}

function buildSignupDescription(planTier: SignupBuilderPlanTier | null) {
  const planLabel = getPlanLabel(planTier)
  if (planTier === "organization" || planTier === "operations_support") {
    return `Create your account to continue with ${planLabel}. After email verification, you will go to secure checkout and then workspace onboarding.`
  }
  if (planTier === "free") {
    return "Create your Individual account. After email verification, you will choose your onboarding path and can continue with the free builder workspace."
  }
  return "Create a free account. After email verification, you will choose whether you are building, finding, funding, or supporting nonprofit work."
}

export function CanvasAuthPanel({
  loginRedirectTo,
  mode,
  signupIntentFocus,
  signupPlanTier = null,
}: {
  loginRedirectTo?: string
  mode: "login" | "signup"
  signupIntentFocus?: SignupIntentFocus | null
  signupPlanTier?: SignupBuilderPlanTier | null
}) {
  const isLogin = mode === "login"
  const heading = "Create account"
  const description = buildSignupDescription(signupPlanTier)
  const builderRedirectTo = buildPostSignupBuilderRedirect({
    planTier: signupPlanTier,
    source: "home_signup",
  })
  const builderLoginHref = "/?section=login"
  const shouldLockBuilderIntent = signupPlanTier !== null
  const defaultIntentFocus = signupIntentFocus ?? "build"

  return (
    <CanvasPanelShell centered>
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
        {isLogin ? (
          <LoginPanel
            redirectTo={loginRedirectTo ?? DEFAULT_POST_AUTH_REDIRECT}
            className="max-w-none space-y-5"
            signUpHref="/?section=signup"
          />
        ) : (
          <>
            <div className="mb-3 space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            <SignUpForm
              defaultIntentFocus={defaultIntentFocus}
              lockedIntentFocus={shouldLockBuilderIntent ? "build" : null}
              builderRedirectTo={builderRedirectTo}
              memberRedirectTo={`${FIND_PATH}?member_onboarding=1&source=home_signup`}
              loginHref={builderLoginHref}
            />
          </>
        )}
      </div>
    </CanvasPanelShell>
  )
}

export function HomeSectionPanel({ sectionId }: { sectionId: LegacyHomeSectionId }) {
  if (sectionId === "hero") {
    return (
      <CanvasPanelShell centered>
        <LegacyHomeHeroSection />
      </CanvasPanelShell>
    )
  }

  if (sectionId === "platform") {
    return (
      <CanvasPanelShell>
        <div className="mx-auto flex w-full justify-center">
          <LegacyHomeOfferingsSection layout="stacked" />
        </div>
      </CanvasPanelShell>
    )
  }

  if (sectionId === "accelerator") {
    return (
      <CanvasPanelShell>
        <div className="mx-auto flex w-full justify-center">
          <LegacyHomeAcceleratorSection />
        </div>
      </CanvasPanelShell>
    )
  }

  if (sectionId === "process") {
    return (
      <CanvasPanelShell>
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_1.1fr]">
          <LegacyHomeProcessSection />
        </div>
      </CanvasPanelShell>
    )
  }

  if (sectionId === "team") {
    return (
      <CanvasPanelShell>
        <div className="w-full">
          <LegacyHomeTeamSection withinCanvas />
        </div>
      </CanvasPanelShell>
    )
  }

  return (
    <CanvasPanelShell centered>
      <LegacyHomeHeroSection />
    </CanvasPanelShell>
  )
}
