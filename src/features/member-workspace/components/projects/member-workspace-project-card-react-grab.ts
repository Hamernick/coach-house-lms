"use client"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"

const PROJECT_CARD_REACT_GRAB_SOURCE =
  "src/features/member-workspace/components/projects/member-workspace-project-card.tsx"
const PROJECT_CARD_REACT_GRAB_COMPONENT = "MemberWorkspaceProjectCard"
const PROJECT_CARD_REACT_GRAB_REASON =
  "The project card composition owns this card's rows, footer, and semantic sub-surfaces; shared sidebar shell primitives only own page chrome."

export type MemberWorkspaceProjectCardReactGrabSurfaceKind =
  | "trigger"
  | "content"
  | "indicator"
  | "portal"
  | "root"

export function buildMemberWorkspaceProjectCardReactGrabOwnerId({
  projectId,
  variant,
}: {
  projectId: string
  variant: "list" | "board"
}) {
  return `member-workspace-project-card:${variant}:${projectId}`
}

export function getMemberWorkspaceProjectCardReactGrabOwnerProps({
  ownerId,
  variant,
}: {
  ownerId: string
  variant: "list" | "board"
}) {
  return getReactGrabOwnerProps({
    ownerId,
    component: PROJECT_CARD_REACT_GRAB_COMPONENT,
    source: PROJECT_CARD_REACT_GRAB_SOURCE,
    slot: "card",
    variant,
    canonicalOwnerSource: PROJECT_CARD_REACT_GRAB_SOURCE,
    canonicalOwnerReason: PROJECT_CARD_REACT_GRAB_REASON,
  })
}

export function getMemberWorkspaceProjectCardReactGrabSurfaceProps({
  ownerId,
  slot,
  surfaceKind = "root",
}: {
  ownerId: string
  slot: string
  surfaceKind?: MemberWorkspaceProjectCardReactGrabSurfaceKind
}) {
  return getReactGrabLinkedSurfaceProps({
    ownerId,
    component: PROJECT_CARD_REACT_GRAB_COMPONENT,
    source: PROJECT_CARD_REACT_GRAB_SOURCE,
    slot,
    surfaceKind,
    canonicalOwnerSource: PROJECT_CARD_REACT_GRAB_SOURCE,
    canonicalOwnerReason: PROJECT_CARD_REACT_GRAB_REASON,
  })
}
