import type { UpdateProgramPayload } from "@/actions/programs"

// Staff edit only fields changed in the builder. Keep legacy dates, fields the
// builder does not expose, and newer snapshot keys owned by the organization.
export function buildProgramUpdatePatch(before: UpdateProgramPayload, after: UpdateProgramPayload): UpdateProgramPayload {
  const changes = Object.fromEntries(Object.entries(after).filter(([key, value]) =>
    key !== "wizardSnapshot" && JSON.stringify(value) !== JSON.stringify(before[key as keyof UpdateProgramPayload])))
  const snapshot = Object.fromEntries(Object.entries(after.wizardSnapshot ?? {}).filter(([key, value]) =>
    key !== "updatedAt" && JSON.stringify(value) !== JSON.stringify(before.wizardSnapshot?.[key])))
  if (Object.keys(snapshot).length) changes.wizardSnapshot = { ...snapshot, updatedAt: after.wizardSnapshot?.updatedAt }
  return changes
}
