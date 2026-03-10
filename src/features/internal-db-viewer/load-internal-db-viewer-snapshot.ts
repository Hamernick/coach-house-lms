import { loadInternalDbViewerSnapshot as loadInternalDbViewerSnapshotAction } from "./server/actions"

import type { InternalDbViewerLoadInput, InternalDbViewerSnapshot } from "./types"

export async function loadInternalDbViewerSnapshot(
  input: InternalDbViewerLoadInput
): Promise<InternalDbViewerSnapshot> {
  return loadInternalDbViewerSnapshotAction(input)
}
