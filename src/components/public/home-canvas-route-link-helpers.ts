export type PrimaryNavigationIntent = {
  defaultPrevented: boolean
  button: number
  metaKey: boolean
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  target?: string | null
}

export function isPrimaryPlainNavigationIntent(intent: PrimaryNavigationIntent) {
  return (
    !intent.defaultPrevented &&
    intent.button === 0 &&
    !intent.metaKey &&
    !intent.altKey &&
    !intent.ctrlKey &&
    !intent.shiftKey &&
    (!intent.target || intent.target === "_self")
  )
}
