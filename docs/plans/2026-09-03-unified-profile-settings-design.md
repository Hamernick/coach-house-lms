# Unified Profile Settings Design

## Goal

Replace the separate Profile and Public profile settings pages with one clear,
responsive editor that visually echoes the centered public person profile.

## Information architecture

- Keep one Profile destination in account settings.
- Use a centered identity header for the photo, name, handle, role, publication
  status, and View profile action.
- Follow with a single vertical sequence: Personal details, one Public page
  section for address and visibility, Organizations, and Saved collections.
- Mark private contact information where it appears instead of creating a
  second profile concept.
- Keep Communications, Security, and Danger zone as separate account sections.

## Interaction model

- Account fields continue to use the dialog's Save changes action and dirty
  close protection.
- Username changes retain an explicit save action because they change the
  public URL.
- Publication becomes one immediately persisted switch. Remove the redundant
  switch-plus-button interaction.
- Organization visibility, collection visibility, and avatar upload retain
  their existing immediate-save behavior.
- The account menu exposes one Profile & settings entry.

## Visual direction

- Match the public page's centered avatar and identity hierarchy.
- Use a quiet civic-editorial direction: the person's identity leads, controls
  recede, and publication status never competes with the name.
- Use Geist spacing, neutral surfaces, tight radii, and restrained status color.
- Prefer whitespace and separators over nested cards.
- Use each title once. Do not repeat Profile or Public profile inside the view.
- Preserve mobile touch targets, keyboard focus, long-content handling, and
  light, dark, and system themes.

## Acceptance

- Profile and Public profile are no longer separate navigation destinations.
- The unified view preserves personal fields, username management, publishing,
  verified organizations, and saved collections.
- Pending account edits still trigger the discard warning.
- Mobile and desktop use the same content hierarchy.
- Focused acceptance tests and the complete quality gate pass.
