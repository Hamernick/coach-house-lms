"use client"

import Link from "next/link"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import type { MouseEvent, ReactNode } from "react"

import { HomeCanvasSidebarHeader } from "@/components/public/home-canvas-preview-shell"
import {
  ABOUT_LINK_HREF,
  SIDEBAR_CANVAS_NAV,
  type CanvasSectionId,
} from "@/components/public/home-canvas-preview-config"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const HOME_CANVAS_NAV_MENU_CLASSNAME = "gap-1"

type HomeCanvasPreviewSidebarProps = {
  activeSection: CanvasSectionId
  changeSection: (section: CanvasSectionId) => void
  handleFindRouteClick: (event: MouseEvent<HTMLAnchorElement>) => void
  hideShellSidebar: boolean
  isFindRoutePending: boolean
  primeFindRoute: () => void
  showFindSidebarShell: boolean
  sidebarSlotContent: ReactNode
}

export function HomeCanvasPreviewSidebar({
  activeSection,
  changeSection,
  handleFindRouteClick,
  hideShellSidebar,
  isFindRoutePending,
  primeFindRoute,
  showFindSidebarShell,
  sidebarSlotContent,
}: HomeCanvasPreviewSidebarProps) {
  if (hideShellSidebar) return null

  return (
    <Sidebar
      collapsible={showFindSidebarShell ? "offcanvas" : "icon"}
      variant="sidebar"
      className="border-0 bg-[var(--shell-rail)]"
    >
      <HomeCanvasSidebarHeader />

      {showFindSidebarShell ? (
        (sidebarSlotContent ?? <SidebarContent className="min-h-0 flex-1" />)
      ) : (
        <SidebarContent className="pt-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className={HOME_CANVAS_NAV_MENU_CLASSNAME}>
                {SIDEBAR_CANVAS_NAV.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      type="button"
                      isActive={activeSection === item.id}
                      tooltip={item.label}
                      aria-current={
                        activeSection === item.id ? "page" : undefined
                      }
                      onClick={() => changeSection(item.id)}
                    >
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Find organizations"
                    isActive={activeSection === "find"}
                    aria-current={activeSection === "find" ? "page" : undefined}
                  >
                    <Link
                      href="/find"
                      prefetch
                      aria-busy={isFindRoutePending || undefined}
                      onClick={handleFindRouteClick}
                      onFocus={primeFindRoute}
                      onMouseEnter={primeFindRoute}
                      onTouchStart={primeFindRoute}
                      className="flex w-full items-center gap-2"
                    >
                      {isFindRoutePending ? (
                        <>
                          <LoaderCircleIcon
                            className="h-4 w-4 animate-spin"
                            aria-hidden
                          />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <span>Find</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto pt-1 pb-[calc(var(--shell-rail-padding,0.75rem)+0.25rem)]">
            <SidebarGroupContent>
              <SidebarMenu className={HOME_CANVAS_NAV_MENU_CLASSNAME}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    type="button"
                    isActive={activeSection === "signup"}
                    tooltip="Sign up"
                    className="bg-background hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground h-8 w-fit justify-center rounded-full border px-3 data-[active=true]:border-transparent"
                    onClick={() => changeSection("signup")}
                  >
                    <span>Sign up</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a
                      href={ABOUT_LINK_HREF}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span className="truncate">About</span>
                      <ArrowUpRight
                        className="text-muted-foreground/65 ml-auto h-4 w-4"
                        aria-hidden
                      />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}
    </Sidebar>
  )
}
