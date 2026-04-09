import type { MemberWorkspaceStorageMode } from "../types"

export const MEMBER_WORKSPACE_STARTER_VERSION = 1

export function resolveMemberWorkspaceStorageMode(
  records: Array<{ created_source: string }>,
): MemberWorkspaceStorageMode {
  if (records.length === 0) return "empty"

  const starterCount = records.filter(
    (record) => record.created_source === "starter_seed",
  ).length

  if (starterCount === 0) return "custom"
  if (starterCount === records.length) return "starter"
  return "mixed"
}
