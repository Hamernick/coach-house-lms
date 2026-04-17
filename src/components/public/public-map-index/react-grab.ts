"use client"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"

const PUBLIC_MAP_LIST_CARD_REACT_GRAB_SOURCE =
  "src/components/public/public-map-index/organization-list.tsx"
const PUBLIC_MAP_LIST_CARD_REACT_GRAB_COMPONENT =
  "PublicMapOrganizationListCard"
const PUBLIC_MAP_LIST_CARD_REACT_GRAB_REASON =
  "The public map list card composition owns the card's semantic sub-surfaces; shared Button, Avatar, Badge, and media primitives only own reusable chrome."

export function buildPublicMapOrganizationListCardOwnerId(orgId: string) {
  return `public-map-organization-list-card:${orgId}`
}

export function buildPublicMapOrganizationListCardOwnerProps({
  ownerId,
  slot,
  notes,
}: {
  ownerId: string
  slot: string
  notes?: string
}) {
  if (process.env.NODE_ENV === "production") return {}

  return getReactGrabOwnerProps({
    ownerId,
    component: PUBLIC_MAP_LIST_CARD_REACT_GRAB_COMPONENT,
    source: PUBLIC_MAP_LIST_CARD_REACT_GRAB_SOURCE,
    slot,
    canonicalOwnerSource: PUBLIC_MAP_LIST_CARD_REACT_GRAB_SOURCE,
    canonicalOwnerReason: PUBLIC_MAP_LIST_CARD_REACT_GRAB_REASON,
    notes,
  })
}

export function buildPublicMapOrganizationListCardSurfaceProps({
  ownerId,
  slot,
  surfaceKind = "root",
  notes,
}: {
  ownerId: string
  slot: string
  surfaceKind?: "trigger" | "content" | "indicator" | "portal" | "root"
  notes?: string
}) {
  if (process.env.NODE_ENV === "production") return {}

  return getReactGrabLinkedSurfaceProps({
    ownerId,
    component: PUBLIC_MAP_LIST_CARD_REACT_GRAB_COMPONENT,
    source: PUBLIC_MAP_LIST_CARD_REACT_GRAB_SOURCE,
    slot,
    surfaceKind,
    canonicalOwnerSource: PUBLIC_MAP_LIST_CARD_REACT_GRAB_SOURCE,
    canonicalOwnerReason: PUBLIC_MAP_LIST_CARD_REACT_GRAB_REASON,
    notes,
  })
}
