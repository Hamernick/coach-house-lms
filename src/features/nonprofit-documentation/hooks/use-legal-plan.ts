"use client"

import { useDocumentationDraftPersistence } from "./use-documentation-draft-persistence"

import { useCallback, useState } from "react"

import {
  DEFAULT_LEGAL_PLAN,
  LEGAL_PLAN_STORAGE_KEY,
  sanitizeLegalPlan,
} from "../lib/legal-plan"
import type { LegalPlanDraft } from "../legal-types"

const EXAMPLE_LEGAL_PLAN: LegalPlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  matterTitle: "Proposed related-party storefront lease",
  stage: "operating",
  category: "property-insurance-risk",
  urgency: "dated-response",
  decisionQuestion:
    "Should the organization lease and operate the proposed storefront, and what reviewed terms, approvals, and conditions would be required before signing or announcing it?",
  knownFacts:
    "The property company is owned by the board chair. Staff received a one-page draft on September 1. It proposes a three-year term, monthly rent below the current staff estimate, and a September 11 signature request. Planned use includes weekday benefits-navigation appointments and two evening workshops each week.",
  assumptionsUnknowns:
    "Unknowns include ownership and signing authority, market comparison, permitted use and occupancy, accessibility, repairs, improvements, utilities, insurance, indemnity, security, participant privacy, signage, funding restrictions, early termination, local approvals, and whether the timeline is negotiable.",
  affectedPeople:
    "Benefits-navigation participants, people with language or disability access needs, staff, volunteers, neighboring tenants, the board chair, other directors, the property company, funders, and the organization.",
  jurisdictionsLocations:
    "The organization and proposed storefront are in the same U.S. state and municipality. Confirm state nonprofit, property, conflict, registration, employment, privacy, and tax questions; local zoning, building, occupancy, accessibility, signage, and program rules; and federal tax, accessibility, funding, and employment interfaces.",
  timelineDeadlines:
    "Draft received September 1. Requested signature September 11. Next board meeting September 7. No legal deadline has been verified. Record the date any revised draft, agency notice, insurer response, permit decision, or funding approval is received.",
  governingDocuments:
    "Collect current articles, bylaws, conflict policy and disclosures, board and committee delegations, signature limits, minutes, exemption materials, grant and donor restrictions, proposed lease and exhibits, property records supplied by the owner, insurance policies, program requirements, and current agency sources.",
  actionsCommunications:
    "Preserve the original draft and communications. Pause signature and public announcement. Acknowledge the requested date without accepting it. Use the alternate conflict-reporting path. Ask the disinterested board members to authorize counsel and facility, insurance, accessibility, program, tax, and local review.",
  authorityConflicts:
    "The board chair disclosed ownership and will not direct the intake, select counsel, participate in deliberation or voting, or receive nonpublic advice except as counsel and the disinterested board determine. Confirm quorum, recusal, independent comparison, board authority, staff delegation, and who may negotiate and sign.",
  safetyRightsAccess:
    "No current incident is known. Before occupancy, review safe entry and exit, emergency plans, building and program safety, effective communication, physical and digital accessibility, privacy during appointments, evening staffing, incident reporting, and uninterrupted access to current services.",
  evidencePreservation:
    "Retain the original proposal, attachments, emails, texts used for organization business, meeting materials, disclosures, minutes, comparisons, inspection and access findings, insurer communications, funding terms, permits, advice, revisions, approvals, and final decision in approved systems. Ask counsel before changing routine deletion for related records.",
  confidentialityDataBoundary:
    "This planning brief excludes participant records, personal addresses, insurance credentials, private board communications, and legal advice. Share only the minimum necessary material through approved channels. Keep counsel communications, board records, property due diligence, participant data, and public communications in their designated systems and access groups.",
  counselReferral:
    "Engage an attorney licensed in the state with nonprofit governance and commercial lease experience, subject to a conflict check and approved fee scope. Ask counsel to identify applicable authority, related-party process, material lease risks, required review, negotiation options, records, approvals, and what other local or specialist advice is needed.",
  decisionFollowUp:
    "Disinterested directors will record advice received, options, recusal, comparisons, authority, decision, conditions, approved negotiator and signer, communications, permits and insurance prerequisites, responsible owners, completion evidence, and post-occupancy review. Reopen review for material term, use, ownership, funding, access, incident, or law changes.",
  hasUrgentSafetyReview: true,
  hasAuthorityConflictReview: true,
  hasJurisdictionSourceReview: true,
  hasQualifiedCounselReview: true,
}

export function useLegalPlan() {
  const [draft, setDraft] = useState(DEFAULT_LEGAL_PLAN)
  const { storageReady, storageStatus } = useDocumentationDraftPersistence(
    LEGAL_PLAN_STORAGE_KEY,
    draft,
    setDraft,
    sanitizeLegalPlan
  )

  const updateDraft = useCallback(
    <Key extends keyof LegalPlanDraft>(key: Key, value: LegalPlanDraft[Key]) =>
      setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  return {
    draft,
    storageReady,
    storageStatus,
    updateDraft,
    loadExample: useCallback(() => setDraft(EXAMPLE_LEGAL_PLAN), []),
    reset: useCallback(() => setDraft(DEFAULT_LEGAL_PLAN), []),
  }
}
