"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import BookOpenTextIcon from "lucide-react/dist/esm/icons/book-open-text"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { DOCUMENTATION_NAVIGATION, DOCUMENTATION_PATH } from "../lib"

const DOCUMENTATION_RAIL_SOURCE =
  "src/features/nonprofit-documentation/components/documentation-rail.tsx"

export function DocumentationRail({
  contextual = false,
}: {
  contextual?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "gap-1 px-2 pb-4 group-data-[collapsible=icon]:px-0",
        contextual &&
          "border-border/60 mt-2 border-t pt-3 group-data-[collapsible=icon]:hidden"
      )}
      aria-label="Documentation navigation"
      {...getReactGrabOwnerProps({
        ownerId: "nonprofit-documentation:rail",
        component: "DocumentationRail",
        source: DOCUMENTATION_RAIL_SOURCE,
        slot: contextual ? "authenticated-context" : "public-primary",
        canonicalOwnerSource: DOCUMENTATION_RAIL_SOURCE,
        canonicalOwnerReason:
          "The documentation feature owns its section labels, route availability, and active state.",
        primitiveImport: "@/components/ui/sidebar",
      })}
    >
      <SidebarGroup className="py-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === DOCUMENTATION_PATH}
                tooltip="Documentation home"
                className="justify-start gap-2"
              >
                <Link
                  href={DOCUMENTATION_PATH}
                  className="flex items-center gap-2"
                >
                  <BookOpenTextIcon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {DOCUMENTATION_NAVIGATION.map((section) => (
        <SidebarGroup key={section.id} className="py-2">
          <SidebarGroupLabel className="text-[0.68rem] font-semibold tracking-[0.12em] uppercase">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = Boolean(
                  item.href &&
                  !item.href.includes("#") &&
                  pathname === item.href
                )

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.href ? (
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="justify-start"
                      >
                        <Link
                          href={item.href}
                          className="flex min-w-0 items-center gap-2"
                          title={item.description}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.external ? (
                            <ArrowUpRightIcon
                              className="ml-auto size-3.5 shrink-0"
                              aria-hidden
                            />
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <div
                        className="text-muted-foreground flex h-8 min-w-0 items-center px-2 text-sm"
                        aria-disabled="true"
                        title={`${item.description} Planned for a later phase.`}
                      >
                        <span className="truncate">{item.title}</span>
                      </div>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  )
}
