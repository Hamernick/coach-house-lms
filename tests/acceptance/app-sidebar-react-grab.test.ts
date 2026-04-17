import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SidebarBody } from "@/components/app-sidebar"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { SidebarProvider } from "@/components/ui/sidebar"

vi.mock("next/navigation", () => ({
  usePathname: () => "/tasks",
  useSearchParams: () => new URLSearchParams(),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("app sidebar react grab", () => {
  it("tags main nav items with semantic ownership metadata and sidebar class assembly", () => {
    vi.stubGlobal("window", { __REACT_GRAB_SURFACES__: {} })

    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        null,
        React.createElement(NavMain, {
          items: [{ title: "Tasks", href: "/tasks", icon: ClipboardListIcon }],
        }),
      ),
    )

    expect(markup).toContain('data-react-grab-anchor="AppSidebarMainNavItem"')
    expect(markup).toContain('data-react-grab-owner-id="app-sidebar:main:tasks"')
    expect(markup).toContain('data-react-grab-owner-source="src/components/nav-main.tsx"')
    expect(markup).toContain(
      'data-react-grab-canonical-owner-source="src/components/nav-main.tsx"',
    )

    expect(window.__REACT_GRAB_SURFACES__["app-sidebar:main:tasks"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "AppSidebarMainNavItem",
          slot: "sidebar-menu-button-trigger",
          source: "src/components/nav-main.tsx",
          surfaceKind: "trigger",
          classAssemblyFile: "src/components/ui/sidebar/layout.tsx",
          primitiveImport: "@/components/ui/sidebar",
        }),
      ]),
    )
  })

  it("tags resource nav items with semantic ownership metadata and sidebar class assembly", () => {
    vi.stubGlobal("window", { __REACT_GRAB_SURFACES__: {} })

    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        null,
        React.createElement(NavDocuments, {
          items: [
            {
              name: "Community",
              url: "/community",
              icon: MessageCircleIcon,
            },
          ],
        }),
      ),
    )

    expect(markup).toContain('data-react-grab-anchor="AppSidebarResourceNavItem"')
    expect(markup).toContain('data-react-grab-owner-id="app-sidebar:resources:community"')
    expect(markup).toContain('data-react-grab-owner-source="src/components/nav-documents.tsx"')

    expect(window.__REACT_GRAB_SURFACES__["app-sidebar:resources:community"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "AppSidebarResourceNavItem",
          slot: "sidebar-menu-button-trigger",
          source: "src/components/nav-documents.tsx",
          surfaceKind: "trigger",
          classAssemblyFile: "src/components/ui/sidebar/layout.tsx",
          primitiveImport: "@/components/ui/sidebar",
        }),
      ]),
    )
  })

  it("does not render the onboarding-locked Welcome nav item", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        null,
        React.createElement(SidebarBody, {
          isAdmin: false,
          isTester: false,
          user: {
            name: "Coach House User",
            title: null,
            email: null,
            avatar: null,
          },
          onboardingLocked: true,
          onboardingIntentFocus: "build",
        }),
      ),
    )

    expect(markup).not.toContain(">Welcome<")
    expect(markup).not.toContain("/onboarding?source=onboarding")
    expect(markup).not.toContain("app-sidebar:onboarding:welcome")
  })
})
