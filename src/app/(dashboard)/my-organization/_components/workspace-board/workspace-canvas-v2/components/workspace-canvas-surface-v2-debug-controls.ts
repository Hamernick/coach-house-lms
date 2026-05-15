export function shouldShowWorkspaceCanvasInternalTutorialRestart({
  allowEditing,
  isPlatformAdmin,
  presentationMode,
  environment,
}: {
  allowEditing: boolean
  isPlatformAdmin?: boolean
  presentationMode: boolean
  environment: string | undefined
}) {
  if (presentationMode) return false
  if (isPlatformAdmin === true) return true
  return allowEditing && environment === "development"
}
