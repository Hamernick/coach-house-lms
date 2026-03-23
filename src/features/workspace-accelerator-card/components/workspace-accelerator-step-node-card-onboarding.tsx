"use client"

import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"
import { OnboardingWorkspaceCard } from "@/components/onboarding/onboarding-workspace-card"
import { WORKSPACE_TEXT_STYLES } from "@/components/workspace/workspace-typography"

export function WorkspaceAcceleratorOnboardingStepBody({
  view,
  defaults,
  onSubmit,
}: {
  view: "welcome" | "organization-setup"
  defaults?: OnboardingFlowDefaults | null
  onSubmit?: (form: FormData) => Promise<void>
}) {
  if (view === "welcome") {
    return (
      <div className="space-y-5 px-5 py-4">
        <section className="space-y-2">
          <p className={WORKSPACE_TEXT_STYLES.bodyMuted}>
            This workspace is the command center for your organization. The guide
            will introduce one card at a time, show how the pieces connect, and
            keep the accelerator close while you learn the system.
          </p>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="border-border/60 bg-background/70 rounded-xl border p-3">
            <p className={WORKSPACE_TEXT_STYLES.meta}>Center card</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Organization anchors the board and gives the rest of the workspace
              real context.
            </p>
          </section>
          <section className="border-border/60 bg-background/70 rounded-xl border p-3">
            <p className={WORKSPACE_TEXT_STYLES.meta}>Connected tools</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Programs, documents, fundraising, calendar, and communications stay
              connected instead of living in separate tabs.
            </p>
          </section>
          <section className="border-border/60 bg-background/70 rounded-xl border p-3">
            <p className={WORKSPACE_TEXT_STYLES.meta}>Formation first</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Start here, then move into setup so the accelerator can organize
              itself around your real organization details.
            </p>
          </section>
        </div>

        <div className="border-border/60 bg-muted/20 rounded-xl border px-3.5 py-3">
          <p className={WORKSPACE_TEXT_STYLES.meta}>Next</p>
          <p className="mt-1 text-sm leading-6 text-foreground">
            Complete this step to open workspace setup, then save your
            organization basics before moving into the first Formation module.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <section className="space-y-1">
        <p className={WORKSPACE_TEXT_STYLES.meta}>Organization setup</p>
        <p className={WORKSPACE_TEXT_STYLES.bodyMuted}>
          Reuse the same onboarding form here so Formation starts with your real
          organization details instead of placeholders.
        </p>
      </section>

      {onSubmit ? (
        <div className="min-h-0 overflow-hidden rounded-[24px]">
          <OnboardingWorkspaceCard
            {...(defaults ?? {})}
            mode="workspace_setup"
            onSubmit={onSubmit}
          />
        </div>
      ) : (
        <div className="border-border/60 bg-background/70 rounded-xl border p-4">
          <p className="text-sm leading-6 text-foreground">
            Organization setup is unavailable right now. Reload this page and try
            again.
          </p>
        </div>
      )}
    </div>
  )
}
