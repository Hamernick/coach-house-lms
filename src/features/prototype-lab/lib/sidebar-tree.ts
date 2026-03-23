export type PrototypeLabSidebarTreeEntryNode = {
  id: string
  label: string
  href: string
  kind: "entry"
}

export type PrototypeLabSidebarTreeFolderNode = {
  id: string
  label: string
  kind: "folder"
  children: PrototypeLabSidebarTreeNode[]
}

export type PrototypeLabSidebarTreeNode =
  | PrototypeLabSidebarTreeEntryNode
  | PrototypeLabSidebarTreeFolderNode

export const DEFAULT_PROTOTYPE_LAB_ENTRY_ID = "team-invite-sheet"

const PROTOTYPE_LAB_BASE_PATH = "/admin/platform/prototypes"

const PROTOTYPE_LAB_SIDEBAR_TREE: PrototypeLabSidebarTreeNode[] = [
  {
    id: "invites",
    label: "Invites",
    kind: "folder",
    children: [
      {
        id: "invites:flows",
        label: "Flows",
        kind: "folder",
        children: [
          {
            id: "team-invite-sheet",
            label: "Invite composer",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=team-invite-sheet`,
            kind: "entry",
          },
          {
            id: "access-request-review",
            label: "Access request review",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=access-request-review`,
            kind: "entry",
          },
        ],
      },
    ],
  },
  {
    id: "email-gallery",
    label: "Email Gallery",
    kind: "folder",
    children: [
      {
        id: "email-gallery:app",
        label: "App emails",
        kind: "folder",
        children: [
          {
            id: "organization-external-invite",
            label: "Organization invite email",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=organization-external-invite`,
            kind: "entry",
          },
          {
            id: "organization-existing-user-request",
            label: "Existing user request email",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=organization-existing-user-request`,
            kind: "entry",
          },
        ],
      },
      {
        id: "email-gallery:auth",
        label: "Auth emails",
        kind: "folder",
        children: [
          {
            id: "supabase-confirm-sign-up",
            label: "Confirm sign up",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-confirm-sign-up`,
            kind: "entry",
          },
          {
            id: "supabase-invite-user",
            label: "Invite user",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-invite-user`,
            kind: "entry",
          },
          {
            id: "supabase-magic-link",
            label: "Magic link",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-magic-link`,
            kind: "entry",
          },
          {
            id: "supabase-change-email",
            label: "Change email address",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-change-email`,
            kind: "entry",
          },
          {
            id: "supabase-reset-password",
            label: "Reset password",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-reset-password`,
            kind: "entry",
          },
          {
            id: "supabase-reauthentication",
            label: "Reauthentication",
            href: `${PROTOTYPE_LAB_BASE_PATH}?entry=supabase-reauthentication`,
            kind: "entry",
          },
        ],
      },
    ],
  },
]

export function listPrototypeLabSidebarTree() {
  return PROTOTYPE_LAB_SIDEBAR_TREE
}

function hasEntryId(
  nodes: PrototypeLabSidebarTreeNode[],
  entryId: string,
): boolean {
  return nodes.some((node) => {
    if (node.kind === "entry") return node.id === entryId
    return hasEntryId(node.children, entryId)
  })
}

export function resolvePrototypeLabSidebarActiveEntryId(
  entryId: string | null | undefined,
) {
  if (typeof entryId === "string") {
    const normalizedEntryId = entryId.trim()
    if (hasEntryId(PROTOTYPE_LAB_SIDEBAR_TREE, normalizedEntryId)) {
      return normalizedEntryId
    }
  }

  return DEFAULT_PROTOTYPE_LAB_ENTRY_ID
}

function collectOpenFolderIds(
  nodes: PrototypeLabSidebarTreeNode[],
  entryId: string,
  parentIds: string[] = [],
): string[] {
  for (const node of nodes) {
    if (node.kind === "entry") {
      if (node.id === entryId) return parentIds
      continue
    }

    const nextParentIds = [...parentIds, node.id]
    const nestedMatch = collectOpenFolderIds(node.children, entryId, nextParentIds)
    if (nestedMatch.length > 0) return nestedMatch
  }

  return []
}

export function resolvePrototypeLabSidebarOpenFolderIds(
  entryId: string | null | undefined,
) {
  const activeEntryId = resolvePrototypeLabSidebarActiveEntryId(entryId)
  return collectOpenFolderIds(PROTOTYPE_LAB_SIDEBAR_TREE, activeEntryId)
}
