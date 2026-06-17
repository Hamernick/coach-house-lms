export type DocumentRowActionPresentation = "table" | "mobile"

export const DOCUMENT_ROW_ACTIONS_CLASSNAME =
  "flex w-full min-w-0 items-center justify-start gap-1.5"

export const DOCUMENT_ROW_MOBILE_ACTIONS_CLASSNAME =
  "flex w-full min-w-0 flex-wrap items-center justify-start gap-1.5"

export const DOCUMENT_ROW_FRAME_ICON_BUTTON_CLASSNAME =
  "border-border/60 bg-muted/70 text-foreground h-8 w-8 rounded-full border shadow-sm hover:bg-muted hover:text-foreground"

export const DOCUMENT_ROW_MOBILE_ACTION_BUTTON_CLASSNAME =
  "h-7 max-w-full overflow-visible rounded-full border-transparent bg-muted/55 px-2.5 py-1 text-xs leading-none text-muted-foreground shadow-none transition-[background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"

export const DOCUMENT_ROW_MOBILE_DESTRUCTIVE_ACTION_BUTTON_CLASSNAME = `${DOCUMENT_ROW_MOBILE_ACTION_BUTTON_CLASSNAME} text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive`

export function getDocumentRowActionsClassName(
  presentation: DocumentRowActionPresentation
) {
  return presentation === "mobile"
    ? DOCUMENT_ROW_MOBILE_ACTIONS_CLASSNAME
    : DOCUMENT_ROW_ACTIONS_CLASSNAME
}

export function getDocumentRowActionButtonClassName(
  presentation: DocumentRowActionPresentation,
  intent: "default" | "destructive" = "default"
) {
  if (presentation !== "mobile") {
    return DOCUMENT_ROW_FRAME_ICON_BUTTON_CLASSNAME
  }

  return intent === "destructive"
    ? DOCUMENT_ROW_MOBILE_DESTRUCTIVE_ACTION_BUTTON_CLASSNAME
    : DOCUMENT_ROW_MOBILE_ACTION_BUTTON_CLASSNAME
}

export function getDocumentRowActionButtonSize(
  presentation: DocumentRowActionPresentation
) {
  return presentation === "mobile" ? "sm" : "icon"
}

export function shouldShowDocumentRowActionLabel(
  presentation: DocumentRowActionPresentation
) {
  return presentation === "mobile"
}
