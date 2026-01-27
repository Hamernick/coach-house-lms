Status: In Progress
Owner: Caleb
Priority: P0
Target release: Launch

---

## Purpose
- Allow multiple accounts (staff/board) to access a single organization securely.
- Unblock real “invite teammates” workflow and org admin collaboration.

## Current State
- Org data is keyed to `organizations.user_id = auth.uid()`, so non-owners can’t access org pages.
- Invites/memberships exist, but membership doesn’t grant access to org-owned data.

## Scope
In scope:
- “Active org” resolution for signed-in users (owner or invited member).
- Membership-aware RLS for org-owned data: `organizations`, `programs`, `roadmap_events`.
- Storage access for org folders: `org-documents`, `org-media`, `program-media`.
- Org roles:
  - `board`: read-only.
  - `staff` + `admin`: can edit org profile/docs/programs/roadmap.
  - `owner`: full access.
- Invites:
  - Owner can invite always.
  - Org-role `admin` cannot invite by default.
  - Owner can toggle whether org-role `admin` can invite.
- RLS tests for membership access and invite gating.

Out of scope:
- Multi-org switching UI.
- Fine-grained per-person overrides (e.g. “board can edit” without role change).
- Refactoring LMS/accelerator access to be org-based.

## UX Flow
- Owner: Account settings → Organization → invite/manage members, toggle “org admins can invite”.
- Invitee: accepts `/join-organization?token=…` → redirected to `/my-organization`.
- Member: `/my-organization`, `/people`, `/my-organization/roadmap`, `/my-organization/documents` render org data for active org.

## Data & Architecture
- Tables:
  - Existing: `organization_memberships`, `organization_invites`.
  - Add: `organization_access_settings` (org-level toggles).
- RLS:
  - `organizations` select for members; update for staff/admin/owner; insert to support upserts.
  - `programs` select for members; write for staff/admin/owner.
  - `roadmap_events` select for members; write for staff/admin/owner.
  - `organization_invites` owner-managed; allow org-role `admin` when `admins_can_invite = true`.
- Storage policies:
  - `org-documents`: members can read; staff/admin/owner can write.
  - `org-media` + `program-media`: public read; staff/admin/owner can write to org folder.
- App:
  - Shared “active org id” resolver used by org pages + route handlers.

## Security & Privacy
- Enforce via RLS + storage policies (no client-only checks).
- Prevent org admins from inviting unless explicitly enabled for that org.
- Board role remains read-only by default (edit requires role change).

## Acceptance Criteria
- A staff/board member can view the owner’s org pages after accepting an invite.
- A board member cannot upload/edit org docs/media/programs/roadmap.
- A staff/admin member can edit org profile/docs/programs/roadmap.
- Org-role admin can’t create invites unless “admins can invite” is enabled.
- `pnpm test:rls` includes membership + invite permission coverage.

## Test Plan
- RLS tests: membership read/write across org-owned tables + invite gating.
- Acceptance smoke: invite → accept → member can view org pages; staff can edit; board blocked.
