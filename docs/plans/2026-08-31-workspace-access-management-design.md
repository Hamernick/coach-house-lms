# Workspace access management consolidation

## Decision

Use the existing Workspace team-access drawer as the primary access-management
surface. Keep the current People drawer and temporary collaboration behavior
unchanged.

## User experience

- Replace the separate Invite and Manage members actions with Manage access.
- Keep Team and Temporary invitation choices.
- Show accepted organization members in the Team section.
- Allow authorized users to change non-owner roles or remove members.
- Require confirmation before member removal.
- Show organization invite and calendar delegation settings to authorized users.
- Keep the drawer readable for members who cannot mutate access.

## Architecture

Extend the existing Workspace organization-access snapshot with the members,
settings, and capability flags already returned by the secured organization
access action. Reuse the existing member list, policy controls, and server-side
mutations. Do not add a second permission model or schema change.

## Release boundary

This branch ports the previously archived August 18 implementation onto current
main. It does not change the People drawer, access policies, database schema,
Stripe behavior, deployment configuration, or production data.
