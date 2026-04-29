"use client"

import type { ReactNode } from "react"

import { LoginPanel } from "@/components/auth/login-panel"
import { SignUpForm } from "@/components/auth/sign-up-form"
import {
  LegacyHomeAcceleratorOverviewSection,
  LegacyHomeHeroSection,
  LegacyHomeOfferingsSection,
  LegacyHomeProcessSection,
  LegacyHomeTeamSection,
  type LegacyHomeSectionId,
} from "@/components/public/legacy-home-sections"

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

export function CanvasAuthPanel({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login"
  const heading = "Create account"
  const description =
    "Create a free Individual account first. After email verification, you can set up your organization workspace and choose whether to stay free or upgrade for team access and the accelerator."
  const builderRedirectTo = "/onboarding?source=home_signup"
  const builderLoginHref = "/?section=login"

  return (
    <CanvasPanelShell centered>
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
        {isLogin ? (
          <LoginPanel
            redirectTo={builderRedirectTo}
            className="max-w-none space-y-5"
            signUpHref="/?section=signup"
          />
        ) : (
          <>
            <div className="mb-5 space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{heading}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            <SignUpForm
              lockedIntentFocus="build"
              builderRedirectTo={builderRedirectTo}
              memberRedirectTo="/find?member_onboarding=1&source=home_signup"
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
          <LegacyHomeAcceleratorOverviewSection />
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
