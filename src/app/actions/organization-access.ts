"use server"

import {
  acceptOrganizationInviteActionImpl,
  createOrganizationInviteActionImpl,
  revokeOrganizationInviteActionImpl,
} from "./organization-access/invites"
import { listOrganizationAccessActionImpl } from "./organization-access/list"
import {
  acceptOrganizationAccessRequestActionImpl,
  declineOrganizationAccessRequestActionImpl,
  listMyOrganizationAccessRequestsActionImpl,
  revokeOrganizationAccessRequestActionImpl,
} from "./organization-access/requests"
import {
  removeOrganizationMemberActionImpl,
  setOrganizationMemberTesterFlagActionImpl,
  updateOrganizationMemberRoleActionImpl,
} from "./organization-access/members"
import {
  setOrganizationAdminsCanInviteActionImpl,
  setOrganizationStaffCanManageCalendarActionImpl,
} from "./organization-access/settings"
import type {
  AcceptInviteResult,
  CreateInviteResult,
  OrganizationAccessListResult,
  OrganizationAccessResult,
  OrganizationInviteKind,
  ListOrganizationAccessRequestsResult,
  OrganizationMemberRole,
  RespondToOrganizationAccessRequestResult,
} from "./organization-access/shared"

export type {
  OrganizationAccessInvite,
  OrganizationAccessMember,
  OrganizationAccessRequest,
  OrganizationInviteKind,
  OrganizationMemberRole,
} from "./organization-access/shared"

export async function listOrganizationAccessAction(): Promise<OrganizationAccessListResult> {
  return listOrganizationAccessActionImpl()
}

export async function createOrganizationInviteAction({
  email,
  role,
  inviteKind,
}: {
  email: string
  role: OrganizationMemberRole
  inviteKind?: OrganizationInviteKind
}): Promise<CreateInviteResult> {
  return createOrganizationInviteActionImpl({ email, role, inviteKind })
}

export async function revokeOrganizationInviteAction(
  inviteId: string,
): Promise<OrganizationAccessResult> {
  return revokeOrganizationInviteActionImpl(inviteId)
}

export async function revokeOrganizationAccessRequestAction(
  requestId: string,
): Promise<OrganizationAccessResult> {
  return revokeOrganizationAccessRequestActionImpl(requestId)
}

export async function removeOrganizationMemberAction(
  memberId: string,
): Promise<OrganizationAccessResult> {
  return removeOrganizationMemberActionImpl(memberId)
}

export async function updateOrganizationMemberRoleAction({
  memberId,
  role,
}: {
  memberId: string
  role: OrganizationMemberRole
}): Promise<OrganizationAccessResult> {
  return updateOrganizationMemberRoleActionImpl({ memberId, role })
}

export async function setOrganizationMemberTesterFlagAction({
  memberId,
  isTester,
}: {
  memberId: string
  isTester: boolean
}): Promise<OrganizationAccessResult> {
  return setOrganizationMemberTesterFlagActionImpl({ memberId, isTester })
}

export async function setOrganizationAdminsCanInviteAction(
  next: boolean,
): Promise<OrganizationAccessResult> {
  return setOrganizationAdminsCanInviteActionImpl(next)
}

export async function setOrganizationStaffCanManageCalendarAction(
  next: boolean,
): Promise<OrganizationAccessResult> {
  return setOrganizationStaffCanManageCalendarActionImpl(next)
}

export async function acceptOrganizationInviteAction(
  token: string,
): Promise<AcceptInviteResult> {
  return acceptOrganizationInviteActionImpl(token)
}

export async function listMyOrganizationAccessRequestsAction(): Promise<ListOrganizationAccessRequestsResult> {
  return listMyOrganizationAccessRequestsActionImpl()
}

export async function acceptOrganizationAccessRequestAction(
  requestId: string,
): Promise<RespondToOrganizationAccessRequestResult> {
  return acceptOrganizationAccessRequestActionImpl(requestId)
}

export async function declineOrganizationAccessRequestAction(
  requestId: string,
): Promise<RespondToOrganizationAccessRequestResult> {
  return declineOrganizationAccessRequestActionImpl(requestId)
}
