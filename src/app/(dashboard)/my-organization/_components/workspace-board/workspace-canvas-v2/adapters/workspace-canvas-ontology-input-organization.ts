import type {
  OrgDocument,
  OrgProfile,
} from "@/components/organization/org-profile-card/types"
import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyNodeInput,
} from "@/features/workspace-ontology"
import {
  getOrganizationDocumentsPath,
  getWorkspaceEditorPath,
} from "@/lib/workspace/routes"

import type { WorkspaceOrganizationEditorData } from "../../workspace-board-types"

const PROFILE_FIELDS = [
  ["name", "Organization name"],
  ["mission", "Mission"],
  ["vision", "Vision"],
  ["email", "Contact email"],
  ["address", "Address"],
  ["logoUrl", "Logo"],
] as const

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value)
}

function fieldNode(
  profile: OrgProfile,
  [field, label]: (typeof PROFILE_FIELDS)[number],
  canEdit: boolean
): WorkspaceOntologyNodeInput {
  const complete = hasValue(profile[field])
  return {
    id: `ontology:organization:field:${field}`,
    label,
    description: complete
      ? "Organization profile value is available."
      : `Add ${label.toLowerCase()} to complete the operating profile.`,
    category: "organization",
    kind: "Profile field",
    status: complete ? "complete" : "missing",
    statusLabel: complete ? "Complete" : "Missing information",
    relationshipLabel: "requires",
    href: getWorkspaceEditorPath({ tab: "company", focus: field }),
    actionLabel: complete || !canEdit ? "Review" : "Complete",
    keywords: [field, "profile", "identity"],
  }
}

function documentLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase())
}

function buildDocumentNodes(
  documents: Record<string, OrgDocument | null | undefined>,
  canEdit: boolean
): WorkspaceOntologyNodeInput[] {
  return Object.entries(documents).map(([key, document]) => ({
    id: `ontology:document:${key}`,
    label: document?.name?.trim() || documentLabel(key),
    description: document
      ? "Stored in the organization document vault."
      : "Upload this document when it becomes available.",
    category: "documents",
    kind: "Document",
    status: document ? "complete" : "missing",
    statusLabel: document ? "Available" : "Missing document",
    relationshipLabel: "documents",
    href: getOrganizationDocumentsPath({ focus: key }),
    actionLabel: document || !canEdit ? "Open vault" : "Upload",
    keywords: [key, "vault", "file"],
  }))
}

export function buildWorkspaceOrganizationOntologyRoot({
  editor,
}: {
  editor: WorkspaceOrganizationEditorData
}): WorkspaceOntologyInput["roots"][number] {
  const documents = buildDocumentNodes(
    (editor.documentsTab.documents ?? {}) as Record<
      string,
      OrgDocument | null | undefined
    >,
    editor.canEdit
  )

  return {
    id: "organization-overview",
    label: "Organization",
    children: [
      {
        id: "ontology:organization:profile",
        label: "Operating profile",
        description: "Identity, mission, contact, and public-facing basics.",
        category: "organization",
        kind: "Profile",
        status: PROFILE_FIELDS.every(([field]) =>
          hasValue(editor.initialProfile[field])
        )
          ? "complete"
          : "missing",
        statusLabel: PROFILE_FIELDS.every(([field]) =>
          hasValue(editor.initialProfile[field])
        )
          ? "Profile complete"
          : "Profile needs attention",
        relationshipLabel: "defines",
        href: getWorkspaceEditorPath({ tab: "company" }),
        actionLabel: "Edit profile",
        children: PROFILE_FIELDS.map((field) =>
          fieldNode(editor.initialProfile, field, editor.canEdit)
        ),
      },
      {
        id: "ontology:organization:people",
        label: "People and ownership",
        description: "Staff, board members, advisors, and reporting context.",
        category: "people",
        kind: "Team",
        status: editor.people.length > 0 ? "complete" : "missing",
        statusLabel:
          editor.people.length > 0
            ? `${editor.people.length} people`
            : "Add team members",
        relationshipLabel: "operated by",
        href: "/people",
        actionLabel:
          editor.people.length > 0
            ? editor.canEdit
              ? "Manage team"
              : "View team"
            : editor.canEdit
              ? "Add people"
              : "View team",
      },
      {
        id: "ontology:organization:documents",
        label: "Documents",
        description: "Formation, compliance, policy, and reporting records.",
        category: "documents",
        kind: "Document set",
        status:
          documents.length === 0
            ? "missing"
            : documents.some((node) => node.status === "missing")
              ? "in-progress"
              : "complete",
        statusLabel:
          documents.length === 0
            ? "No documents available"
            : `${documents.filter((node) => node.status === "complete").length}/${documents.length} available`,
        relationshipLabel: "Next step",
        href: getOrganizationDocumentsPath(),
        actionLabel: "Open vault",
        children: documents,
      },
    ],
  }
}
