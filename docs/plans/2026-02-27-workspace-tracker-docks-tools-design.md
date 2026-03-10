# Workspace Tracker + Dock Tools Design (2026-02-27)

## Objectives
- Replace the legacy formation card interaction with a compact, high-signal progress + ticket tracker.
- Remove dead vertical gaps and default the tracker content to open.
- Add dock-based visibility controls so users can stage cards on/off canvas quickly.
- Introduce three toggleable utility cards (`Deck`, `Vault`, `Atlas`) without increasing default visual clutter.

## UX Decisions
- The formation card is now a **Tracker** surface with two tabs:
  - `Accelerator`: dynamic roadmap modules from user progress data.
  - `Tickets`: user-owned categories + tickets, with archive flows.
- Section disclosure uses chevrons and starts open by default.
- Status markers use neutral black/white treatment (no blue dependency).
- New utility cards start hidden and are surfaced via docks.
- Bottom dock controls core workspace cards; left dock controls utility cards.

## Data Model
- Extended `WorkspaceBoardState`:
  - `tracker`: tab state, archived accelerator groups, categories, tickets.
  - `hiddenCardIds`: per-card visibility list.
- Added tracker normalization/default logic to preserve backward compatibility with existing persisted board payloads.
- New card IDs:
  - `deck`, `vault`, `atlas`.

## Canvas + Layout Behavior
- React Flow nodes are composed from visible cards only (`hiddenCardIds` filtered).
- Edges are rendered only when both source and target cards are visible.
- Visibility toggles trigger fit-view recenter.
- Formation card no longer uses special collapsed-height node calculations; this removes the gap artifact below progress.

## Extensibility
- Tracker schema supports later persistence, ownership rules, and server actions.
- Utility cards can later swap local staging for uploaded asset-backed storage while preserving card contracts.
- Dock model is card-ID driven and can expand with future tools without changing flow engine wiring.
