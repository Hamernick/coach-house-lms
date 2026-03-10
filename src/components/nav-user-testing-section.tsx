"use client"

import Link from "next/link"
import BellIcon from "lucide-react/dist/esm/icons/bell"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import WrenchIcon from "lucide-react/dist/esm/icons/wrench"

import type { resolveDevtoolsAccess } from "@/lib/devtools/access"
import { Button } from "@/components/ui/button"

type NavUserTestingSectionProps = {
  devtools: ReturnType<typeof resolveDevtoolsAccess>
  adminPending: boolean
  onCloseMenu: () => void
  onOpenOnboarding: () => void
  onStartTutorial: (tutorial: "platform" | "accelerator") => void
  onResetTutorials: () => void
  onResetOnboarding: () => void
  onSeedNotifications: () => void
}

export function NavUserTestingSection({
  devtools,
  adminPending,
  onCloseMenu,
  onOpenOnboarding,
  onStartTutorial,
  onResetTutorials,
  onResetOnboarding,
  onSeedNotifications,
}: NavUserTestingSectionProps) {
  if (!devtools.canSeeTestingMenu) return null

  return (
    <>
      <div className="bg-border/60 my-2 h-px" />
      <div className="text-muted-foreground px-2 py-1 text-xs font-medium">
        Testing
      </div>
      {devtools.canOpenOnboarding ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
          onClick={() => {
            onCloseMenu()
            onOpenOnboarding()
          }}
        >
          <WrenchIcon className="size-4" />
          Open onboarding
        </Button>
      ) : null}
      {devtools.canStartTutorials ? (
        <>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
            onClick={() => {
              onCloseMenu()
              onStartTutorial("platform")
            }}
          >
            <SparklesIcon className="size-4" />
            Start Platform tutorial
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
            onClick={() => {
              onCloseMenu()
              onStartTutorial("accelerator")
            }}
          >
            <SparklesIcon className="size-4" />
            Start Accelerator tutorial
          </Button>
        </>
      ) : null}
      {devtools.canShowWelcomeLaunchers ? (
        <>
          <Link
            href="/organization?welcome=1"
            className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
            onClick={onCloseMenu}
          >
            <SparklesIcon className="size-4" />
            Show Platform welcome
          </Link>
          <Link
            href="/accelerator?welcome=1"
            className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
            onClick={onCloseMenu}
          >
            <SparklesIcon className="size-4" />
            Show Accelerator welcome
          </Link>
        </>
      ) : null}
      {devtools.canUsePaymentPlayground ? (
        <Link
          href="/?section=pricing&source=test-playground"
          className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition"
          onClick={onCloseMenu}
        >
          <CreditCardIcon className="size-4" />
          Payment playground
        </Link>
      ) : null}
      {devtools.canResetTutorials ? (
        <Button
          type="button"
          variant="ghost"
          disabled={adminPending}
          className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted disabled:opacity-60"
          onClick={onResetTutorials}
        >
          <RotateCcwIcon className="size-4" />
          Reset tutorials
        </Button>
      ) : null}
      {devtools.canResetOnboarding ? (
        <Button
          type="button"
          variant="ghost"
          disabled={adminPending}
          className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted disabled:opacity-60"
          onClick={onResetOnboarding}
        >
          <RotateCcwIcon className="size-4" />
          Reset onboarding
        </Button>
      ) : null}
      {devtools.canSeedNotifications ? (
        <Button
          type="button"
          variant="ghost"
          disabled={adminPending}
          className="w-full justify-start gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted disabled:opacity-60"
          onClick={onSeedNotifications}
        >
          <BellIcon className="size-4" />
          Seed notifications
        </Button>
      ) : null}
    </>
  )
}
