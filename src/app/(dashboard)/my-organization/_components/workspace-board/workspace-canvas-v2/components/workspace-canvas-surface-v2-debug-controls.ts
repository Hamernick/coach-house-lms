export function shouldShowWorkspaceCanvasInternalTutorialRestart({
  allowEditing,
  presentationMode,
  environment,
}: {
  allowEditing: boolean
  presentationMode: boolean
  environment: string | undefined
}) {
  return allowEditing && !presentationMode && environment === "development"
}
