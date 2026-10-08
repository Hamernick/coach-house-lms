"use client"

import { useEffect, useState } from "react"

import { AppShell } from "@/components/app-shell"
import {
  RightRailSlot,
  RightRailProvider,
} from "@/components/app-shell/right-rail"
import { AppShellMobileNav } from "@/components/app-shell/components/app-shell-mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"

function MobileInitializationMarker() {
  const { isMobile } = useSidebar()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return <span hidden data-mobile-ready={isMobile} data-shell-ready={hydrated} />
}

// Guarded fixture: no account, session, or provider access is created.
export function AppShellVisualFixture({
  scenario,
  withRail,
  fullBleed,
}: {
  scenario?: string
  withRail: boolean
  fullBleed: boolean
}) {
  if (
    scenario === "workspace-navigation" ||
    scenario === "restricted-navigation" ||
    scenario === "locked-navigation"
  ) {
    return (
      <RightRailProvider>
        <SidebarProvider>
          <MobileInitializationMarker />
          <main className="min-h-svh p-4">
            <h1>Navigation visibility fixture</h1>
            {withRail ? <RightRailSlot>Details fixture</RightRailSlot> : null}
          </main>
          <AppShellMobileNav
            showWorkspace={scenario === "workspace-navigation"}
            onboardingLocked={scenario === "locked-navigation"}
            rightOpen={false}
            onRightOpenChange={() => undefined}
          />
        </SidebarProvider>
      </RightRailProvider>
    )
  }
  return (
    <AppShell
      sidebarTree={[]}
      isAdmin={false}
      user={scenario === "member-navigation" ? { name: "Fixture member", email: "member@example.org" } : null}
      contentPresentation={fullBleed ? "full-bleed" : "default"}
      breadcrumbs={<span>Workspace</span>}
    >
      <MobileInitializationMarker />
      <div
        className={
          fullBleed ? "min-h-0 flex-1 overflow-y-auto p-4" : "contents"
        }
      >
        <h1 className="text-2xl font-semibold">Your workspace</h1>
        <Input
          className="max-md:min-h-11"
          aria-label="Search workspace"
          placeholder="Search workspace…"
        />
        {Array.from({ length: 12 }, (_, index) => (
          <section key={index} className="rounded-xl border p-6">
            <h2 className="font-medium">Project {index + 1}</h2>
            <p className="text-muted-foreground">
              Review goals and next steps with your team.
            </p>
          </section>
        ))}
        <Button className="max-md:min-h-11">Last workspace action</Button>
      </div>
      {withRail ? (
        <RightRailSlot>
          <h2 className="font-semibold">Project details</h2>
          <Input
            className="max-md:min-h-11"
            aria-label="Project name"
            defaultValue="Community project"
          />
          <Button className="max-md:min-h-11">Save details</Button>
        </RightRailSlot>
      ) : null}
    </AppShell>
  )
}
