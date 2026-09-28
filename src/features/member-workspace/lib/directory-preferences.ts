type DirectoryPreferenceScope = {
  directory: "organizations" | "projects"
  viewerUserId?: string
}

function storageKey({ directory, viewerUserId }: DirectoryPreferenceScope) {
  return viewerUserId
    ? `member-directory:v1:${viewerUserId}:${directory}`
    : null
}

export function restoreDirectoryQuery(
  scope: DirectoryPreferenceScope,
  currentQuery: string
) {
  if (currentQuery) return currentQuery
  const key = storageKey(scope)
  if (!key) return currentQuery
  try {
    return window.localStorage.getItem(key) ?? currentQuery
  } catch {
    return currentQuery
  }
}

export function saveDirectoryQuery(
  scope: DirectoryPreferenceScope,
  query: string,
  coachFilter: string
) {
  const key = storageKey(scope)
  if (!key) return
  // Keep "all" explicit even when the URL omits it, so a new default cannot
  // silently replace the user's saved selection on their next visit.
  const params = new URLSearchParams(query)
  params.set("coach", coachFilter)
  try {
    window.localStorage.setItem(key, params.toString())
  } catch {
    // URL-based filtering still works when browser storage is unavailable.
  }
}
