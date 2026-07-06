import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readRoute(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public find routes", () => {
  it("does not render the workspace onboarding card on the map", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).not.toContain("OnboardingWorkspaceCard")
      expect(source).not.toContain("completeOnboardingAction")
    }
  })

  it("wires onboarding-locked free/member users into the map-native intro", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute("src/components/public/public-map-index.tsx")
    const previewControlsSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview-controls.tsx",
    )
    const overlaySource = readRoute(
      "src/components/public/public-map-index/member-onboarding-overlay.tsx",
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).toContain("completeMemberMapOnboardingAction")
      expect(source).toContain("memberOnboarding={")
      expect(source).toContain("memberMapOnboarding.hasOrganizationSwitcher")
    }

    expect(publicMapSource).toContain("usePublicMapMemberOnboardingMapOverlay")
    expect(publicMapSource).toContain("mapOverlay={memberOnboardingMapOverlay}")
    expect(previewControlsSource).toContain("PublicMapMemberOnboardingOverlay")
    expect(overlaySource).not.toContain("OnboardingWorkspaceCard")
    expect(overlaySource).toContain("Resource map")
    expect(overlaySource).toContain("Search the right rail")
    expect(overlaySource).toContain("Save resources")
    expect(overlaySource).toContain("Notifications")
  })

  it("lets platform admins preview the map intro from authenticated find", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute("src/components/public/public-map-index.tsx")
    const previewControlsSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview-controls.tsx",
    )
    const previewSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview.ts",
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).toContain("adminOnboardingPreview={{")
      expect(source).toContain("canToggle: shellState.isAdmin")
      expect(source).toContain("memberMapOnboarding.hasOrganizationSwitcher")
    }

    expect(publicMapSource).toContain("usePublicMapMemberOnboardingMapOverlay")
    expect(publicMapSource).toContain("mapOverlay={memberOnboardingMapOverlay}")
    expect(previewControlsSource).toContain("PublicMapMemberOnboardingPreviewToggle")
    expect(previewControlsSource).toContain("Preview intro")
    expect(previewControlsSource).toContain("Hide intro")
    expect(previewControlsSource).toContain(
      "onDismiss={() => handleToggleAdminOnboardingPreview(false)}",
    )
    expect(previewSource).toContain('PUBLIC_MAP_MEMBER_ONBOARDING_PREVIEW_SOURCE = "admin_preview"')
    expect(previewSource).toContain('PUBLIC_MAP_MEMBER_ONBOARDING_QUERY_KEY = "member_onboarding"')
  })

  it("renders authenticated users inside the app shell without moving find under workspace", () => {
    const source = readRoute("src/app/(public)/find/page.tsx")
    expect(source).toContain("AuthenticatedFindShell")
    expect(source).toContain('presentationMode="app-shell"')
    expect(source).not.toContain("/workspace/find")
  })

  it("lets authenticated find use the full app-shell canvas instead of a bordered map frame", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const shellSource = readRoute(
      "src/features/find-map/components/authenticated-find-shell.tsx",
    )
    const mapSurfaceSource = readRoute(
      "src/components/public/public-map-index/map-surface.tsx",
    )
    const publicMapSource = readRoute("src/components/public/public-map-index.tsx")
    const publicMapChromeSource = readRoute(
      "src/components/public/public-map-index/public-map-index-chrome.tsx",
    )
    const appShellSource = readRoute("src/components/app-shell/app-shell-inner.tsx")
    const shellMainContentSource = readRoute(
      "src/components/app-shell/components/shell-main-content.tsx",
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).not.toContain("FindMapFrame")
      expect(source).not.toContain("rounded-lg border border-border/70")
    }

    expect(shellSource).toContain('contentPresentation="full-bleed"')
    expect(mapSurfaceSource).toContain("h-full min-h-0 w-full flex-1")
    expect(publicMapSource).toContain('const useAppShellRightRailDirectory = presentationMode === "app-shell"')
    expect(publicMapSource).toContain("const renderMapOverlaySidebar = renderDesktopSidebar && !useAppShellRightRailDirectory")
    expect(publicMapChromeSource).toContain("PublicMapDirectoryRail")
    expect(publicMapChromeSource).toContain("directoryRail={directoryRail}")
    expect(publicMapSource).toContain("renderDesktopSidebar={renderMapOverlaySidebar}")
    expect(publicMapSource).not.toContain("w-[23rem]")
    expect(publicMapSource).not.toContain("manageShellSidebarOpen={false}")
    expect(shellMainContentSource).toContain("data-shell-mode={")
    expect(shellMainContentSource).toContain('useFullBleedContent ? "full-bleed" : "default"')
    expect(appShellSource).toContain("md:[--shell-right-rail-width:min(22rem,36vw)]")
    expect(shellSource).toContain("showWorkspaceHome={state.showMemberWorkspace}")
    expect(shellSource).toContain("showMemberWorkspace={state.showMemberWorkspace}")
    expect(shellSource).toContain("sidebarHeaderContent={")
    expect(shellSource).toContain("MemberWorkspaceOrgSwitcher")
    expect(shellSource).toContain("state.memberWorkspaceHeader")
    expect(appShellSource).toContain("isMobile")
    expect(shellMainContentSource).toContain('? "rounded-none border-0"')
    expect(shellMainContentSource).toContain(': "rounded-[28px] border border-[color:var(--shell-border)]"')
    expect(appShellSource).not.toContain("useFullBleedContent || isMobile")
  })

  it("does not render the member profile card in public or authenticated find rails", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute("src/components/public/public-map-index.tsx")
    const rightRailSource = readRoute("src/components/public/public-map-index/right-rail.tsx")

    for (const routeFile of routeFiles) {
      expect(readRoute(routeFile)).not.toContain("memberProfile={viewerState.memberProfile}")
    }

    expect(publicMapSource).not.toContain("memberProfile")
    expect(rightRailSource).not.toContain("PublicMapMemberProfileCard")
    expect(rightRailSource).not.toContain("flex flex-col gap-3 p-4")
  })

  it("keeps authenticated find viewer detection lightweight", () => {
    const viewerStateSource = readRoute("src/features/find-map/server/viewer-state.ts")

    expect(viewerStateSource).toContain("supabase.auth.getUser()")
    expect(viewerStateSource).not.toContain(".from(\"profiles\")")
    expect(viewerStateSource).not.toContain("buildOnboardingFlowDefaults")
    expect(viewerStateSource).not.toContain("memberProfile")
  })
})
