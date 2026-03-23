import type { PrototypeLabEntry, PrototypeLabInput } from "../types"

const DEFAULT_ENTRY_ID = "team-invite-sheet"

const PROTOTYPE_LAB_ENTRIES: PrototypeLabEntry[] = [
  {
    id: "team-invite-sheet",
    projectId: "invites",
    folderLabel: "Flows",
    title: "Invite composer",
    description: "Centered draft of the team invite sheet with lightweight role and routing context.",
    kind: "flow",
    statusLabel: "In progress",
  },
  {
    id: "access-request-review",
    projectId: "invites",
    folderLabel: "Flows",
    title: "Access request review",
    description: "Signed-in review surface for existing users who accept or decline access.",
    kind: "flow",
    statusLabel: "Ready for review",
  },
  {
    id: "organization-external-invite",
    projectId: "email-gallery",
    folderLabel: "App emails",
    title: "Organization invite email",
    description: "App-owned invite email for someone who does not yet have a Coach House account.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "organization-existing-user-request",
    projectId: "email-gallery",
    folderLabel: "App emails",
    title: "Existing user request email",
    description: "Heads-up email that sends an existing member back to their in-app request.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-confirm-sign-up",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Confirm sign up",
    description: "Supabase confirmation email preview.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-invite-user",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Invite user",
    description: "Supabase account invite email preview.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-magic-link",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Magic link",
    description: "Passwordless sign-in email preview.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-change-email",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Change email address",
    description: "Email change verification preview.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-reset-password",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Reset password",
    description: "Password recovery email preview.",
    kind: "email",
    statusLabel: "Reference",
  },
  {
    id: "supabase-reauthentication",
    projectId: "email-gallery",
    folderLabel: "Auth emails",
    title: "Reauthentication",
    description: "Sensitive-action verification preview.",
    kind: "email",
    statusLabel: "Reference",
  },
]

export function resolvePrototypeLabSelectedEntryId({
  entryId,
  projectId,
}: {
  entryId: string | null | undefined
  projectId?: string | null | undefined
}) {
  if (typeof entryId === "string") {
    const normalizedEntryId = entryId.trim()
    if (PROTOTYPE_LAB_ENTRIES.some((entry) => entry.id === normalizedEntryId)) {
      return normalizedEntryId
    }
  }

  if (typeof projectId === "string") {
    const normalizedProjectId = projectId.trim()
    const firstProjectEntry = PROTOTYPE_LAB_ENTRIES.find(
      (entry) => entry.projectId === normalizedProjectId,
    )
    if (firstProjectEntry) return firstProjectEntry.id
  }

  return DEFAULT_ENTRY_ID
}

export function buildPrototypeLabInput({
  selectedEntryId,
  selectedProjectId,
}: {
  selectedEntryId: string | null | undefined
  selectedProjectId?: string | null | undefined
}): PrototypeLabInput {
  const resolvedEntryId = resolvePrototypeLabSelectedEntryId({
    entryId: selectedEntryId,
    projectId: selectedProjectId,
  })
  const selectedEntry =
    PROTOTYPE_LAB_ENTRIES.find((entry) => entry.id === resolvedEntryId) ??
    PROTOTYPE_LAB_ENTRIES[0]

  return {
    selectedEntry,
  }
}
