"use client"

export function resolveWorkspaceAcceleratorHeaderPickerScrollDistance({
  contentWidth,
  viewportWidth,
  trailingPadding = 8,
}: {
  contentWidth: number
  viewportWidth: number
  trailingPadding?: number
}) {
  const overflowWidth = Math.max(0, Math.ceil(contentWidth - viewportWidth))
  if (overflowWidth === 0) {
    return 0
  }

  return overflowWidth + trailingPadding
}
