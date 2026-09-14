"use client"

import { useState } from "react"

import { mobileMapControlStyles as styles } from "@/features/mobile-navigation"

import { AppShell } from "@/components/app-shell"
import { Input } from "@/components/ui/input"
import { PublicMapLocationControl } from "@/components/public/public-map-index/location-control"
import { PublicMapMemberOnboardingPreviewToggle } from "@/components/public/public-map-index/member-onboarding-preview-controls"
import { PublicMapMemberOnboardingOverlay } from "@/components/public/public-map-index/member-onboarding-overlay"
import { PublicMapSidebarDrawer } from "@/components/public/public-map-index/sidebar-drawer"
import { FindMapWeatherCard } from "@/features/find-map/client"

export function MobileMapFixture() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [snapIndex, setSnapIndex] = useState<0 | 1 | 2>(0)
  const snapPoints = ["96px", "420px", 1] as const
  const [locationOpen, setLocationOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  return (
    <AppShell
      sidebarTree={[]}
      isAdmin={false}
      user={{ name: "Mobile Demo", email: "demo@example.test", avatar: "/platform-lab/avatar-profile.jpg" }}
      hasActiveSubscription
      context="public"
      contentPresentation="full-bleed"
    >
      <div
        className={`relative h-full overflow-hidden ${styles.surface}`}
        data-mobile-map-fixture
      >
        <div className="bg-muted/30 absolute inset-0" aria-hidden />
        <div
          ref={setContainer}
          className="pointer-events-none absolute inset-0 z-50 transform-gpu"
        />
        <PublicMapLocationControl
          active={false}
          coordinates={null}
          controlOpen={locationOpen}
          feedback={null}
          onConfirm={() => setLocationOpen(false)}
          onControlClick={() => setLocationOpen(true)}
          onOpenChange={setLocationOpen}
          status="idle"
          directoryCount={123456}
          additionalControls={
            <>
              <PublicMapMemberOnboardingPreviewToggle
                active={welcomeOpen}
                onToggle={() => setWelcomeOpen(!welcomeOpen)}
              />
              <FindMapWeatherCard
                className="md:hidden"
                weather={{
                  temperatureFahrenheit: -12,
                  temperatureSource: "observation",
                  signal: "none",
                  freshness: "fresh",
                  updatedAt: "2026-09-12T12:00:00Z",
                }}
              />

            </>
          }
        />
        {container ? (
          <PublicMapSidebarDrawer
            activeSnapIndex={snapIndex}
            activeSnapPoint={snapPoints[snapIndex]}
            drawerIsFullscreen={snapIndex === 2}
            drawerPanel={
              <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                <Input type="search" aria-label="Find resources" placeholder="Find resources" />
                <div className="min-h-0 overflow-y-auto" data-fixture-resource-list="">
                  {Array.from({ length: 20 }, (_, index) => <p key={index} className="border-border border-b py-4">Resource directory preview {index + 1}</p>)}
                </div>
              </div>
            }
            drawerViewportHeight="160px"
            effectiveSidebarMode="search"
            panelOpen
            portalContainer={container}
            setActiveSnapIndex={setSnapIndex}
            setDrawerTab={() => {}}
            setSidebarMode={() => {}}
            snapPoints={[...snapPoints]}
            surfaceHeight={600}
          />
        ) : null}
        {welcomeOpen ? (
          <PublicMapMemberOnboardingOverlay
            hasOrganizationSwitcher
            onDismiss={() => setWelcomeOpen(false)}
          />
        ) : null}
      </div>
    </AppShell>
  )
}
