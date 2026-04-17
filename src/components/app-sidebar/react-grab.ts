"use client"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"

const APP_SIDEBAR_REACT_GRAB_REASON =
  "Sidebar composition owns this item's identity, label, and routing; shared sidebar and tooltip primitives only own reusable chrome."

function slugifySidebarOwnerSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildAppSidebarOwnerId(scope: string, value: string) {
  const normalizedScope = slugifySidebarOwnerSegment(scope) || "item"
  const normalizedValue = slugifySidebarOwnerSegment(value) || "item"
  return `app-sidebar:${normalizedScope}:${normalizedValue}`
}

export function buildAppSidebarMenuButtonOwnerProps({
  ownerId,
  component,
  source,
  variant,
  notes,
}: {
  ownerId: string
  component: string
  source: string
  variant?: string
  notes?: string
}) {
  return getReactGrabOwnerProps({
    ownerId,
    component,
    source,
    slot: "sidebar-menu-button-trigger",
    variant,
    canonicalOwnerSource: source,
    canonicalOwnerReason: APP_SIDEBAR_REACT_GRAB_REASON,
    primitiveImport: "@/components/ui/sidebar",
    notes,
  })
}

export function buildAppSidebarTooltipProps({
  ownerId,
  component,
  source,
  children,
  className,
  notes,
}: {
  ownerId: string
  component: string
  source: string
  children: string
  className?: string
  notes?: string
}) {
  return {
    children,
    className,
    ...getReactGrabLinkedSurfaceProps({
      ownerId,
      component: `${component}Tooltip`,
      source,
      slot: "sidebar-menu-tooltip-content",
      surfaceKind: "content",
      canonicalOwnerSource: source,
      canonicalOwnerReason: APP_SIDEBAR_REACT_GRAB_REASON,
      primitiveImport: "@/components/ui/tooltip",
      notes,
    }),
  }
}
