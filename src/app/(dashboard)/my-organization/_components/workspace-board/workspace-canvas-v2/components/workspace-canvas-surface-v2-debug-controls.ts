export function shouldShowWorkspaceCanvasInternalTutorialRestart({
  isPlatformAdmin,
  presentationMode,
}: {
  allowEditing: boolean
  isPlatformAdmin?: boolean
  presentationMode: boolean
  environment: string | undefined
}) {
  if (presentationMode) return false
  return isPlatformAdmin === true
}
