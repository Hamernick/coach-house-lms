"use server"

import type {
  ResourceMapAdminCanonicalAction,
  ResourceMapAdminImportReviewStatus,
  ResourceMapAdminMatchStatus,
} from "../types"
import {
  markResourceMapImportPromotedAction,
  reviewResourceMapImportMatchAction,
  reviewResourceMapImportRecordAction,
  setResourceMapPublicVisibilityAction,
  updateResourceMapCanonicalFieldsAction,
  updateResourceMapCanonicalStateAction,
} from "./actions"

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function readRequiredFormString(
  formData: FormData,
  key: string,
  label: string
) {
  const value = readFormString(formData, key)
  if (!value) {
    throw new Error(`${label} is required.`)
  }
  return value
}

function assertActionResult(
  result: { ok: true; id: string } | { error: string }
) {
  if ("error" in result) {
    throw new Error(result.error)
  }
}

function requireDecisionReason(reason: string, label: string) {
  if (!reason) {
    throw new Error(`${label} requires an audit reason.`)
  }
}

export async function reviewResourceMapImportRecordFormAction(
  formData: FormData
) {
  const status = readRequiredFormString(
    formData,
    "status",
    "Review status"
  ) as ResourceMapAdminImportReviewStatus
  const reason = readFormString(formData, "reason")

  if (status === "rejected" || status === "stale") {
    requireDecisionReason(reason, status === "stale" ? "Mark stale" : "Reject")
  }

  const result = await reviewResourceMapImportRecordAction({
    importRecordId: readRequiredFormString(
      formData,
      "importRecordId",
      "Import record id"
    ),
    status,
    reason,
  })

  assertActionResult(result)
}

export async function reviewResourceMapImportMatchFormAction(
  formData: FormData
) {
  const status = readRequiredFormString(
    formData,
    "status",
    "Match status"
  ) as ResourceMapAdminMatchStatus
  const reason = readFormString(formData, "reason")

  if (status === "rejected" || status === "superseded") {
    requireDecisionReason(
      reason,
      status === "superseded" ? "Supersede match" : "Reject match"
    )
  }

  const result = await reviewResourceMapImportMatchAction({
    matchId: readRequiredFormString(formData, "matchId", "Match id"),
    status,
    reason,
  })

  assertActionResult(result)
}

export async function updateResourceMapCanonicalStateFormAction(
  formData: FormData
) {
  const action = readRequiredFormString(
    formData,
    "action",
    "Curation action"
  ) as ResourceMapAdminCanonicalAction
  const reason = readFormString(formData, "reason")

  if (action === "hide" || action === "suppress" || action === "delete") {
    requireDecisionReason(reason, action)
  }

  if (action === "delete" && formData.get("confirmDelete") !== "on") {
    throw new Error("Confirm deletion before deleting a resource.")
  }

  const result = await updateResourceMapCanonicalStateAction({
    target: readRequiredFormString(formData, "target", "Resource target") as
      | "organization"
      | "service",
    id: readRequiredFormString(formData, "id", "Resource id"),
    action,
    reason,
  })

  assertActionResult(result)
}

export async function updateResourceMapCanonicalFieldsFormAction(
  formData: FormData
) {
  const target = readRequiredFormString(
    formData,
    "target",
    "Resource target"
  ) as "organization" | "service"
  const reason = readFormString(formData, "reason")

  requireDecisionReason(reason, "Edit resource")

  const fields =
    target === "organization"
      ? {
          name: readFormString(formData, "name"),
          tagline: readFormString(formData, "tagline"),
          description: readFormString(formData, "description"),
          website_url: readFormString(formData, "website_url"),
          donate_url: readFormString(formData, "donate_url"),
        }
      : {
          title: readFormString(formData, "title"),
          subtitle: readFormString(formData, "subtitle"),
          description: readFormString(formData, "description"),
          eligibility: readFormString(formData, "eligibility"),
          cost: readFormString(formData, "cost"),
          who_it_helps: readFormString(formData, "who_it_helps"),
          intake_url: readFormString(formData, "intake_url"),
        }

  const result = await updateResourceMapCanonicalFieldsAction({
    target,
    id: readRequiredFormString(formData, "id", "Resource id"),
    fields,
    reason,
  })

  assertActionResult(result)
}

export async function setResourceMapPublicVisibilityFormAction(
  formData: FormData
) {
  const reason = readFormString(formData, "reason")
  requireDecisionReason(reason, "Contact/link visibility")

  const result = await setResourceMapPublicVisibilityAction({
    kind: readRequiredFormString(formData, "kind", "Visibility kind") as
      | "contact"
      | "link",
    id: readRequiredFormString(formData, "id", "Visibility target id"),
    isPublic:
      readRequiredFormString(formData, "isPublic", "Visibility") === "true",
    reason,
  })

  assertActionResult(result)
}

export async function markResourceMapImportPromotedFormAction(
  formData: FormData
) {
  const reason = readFormString(formData, "reason")
  const result = await markResourceMapImportPromotedAction({
    importRecordId: readRequiredFormString(
      formData,
      "importRecordId",
      "Import record id"
    ),
    promotedOrganizationId: readFormString(formData, "promotedOrganizationId"),
    promotedServiceId: readFormString(formData, "promotedServiceId"),
    reason,
  })

  assertActionResult(result)
}
