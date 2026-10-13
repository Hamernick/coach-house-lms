"use client"

export const WORKSPACE_TUTORIAL_TOOLTIP_INVERSE_SURFACE_CLASSNAME =
  "bg-foreground text-background shadow-md [&_[data-slot=tooltip-arrow]]:bg-foreground [&_[data-slot=tooltip-arrow]]:fill-foreground dark:bg-white dark:text-slate-950 dark:[&_[data-slot=tooltip-arrow]]:bg-white dark:[&_[data-slot=tooltip-arrow]]:fill-white"

export const WORKSPACE_TUTORIAL_PICKER_LIGHT_SURFACE_CLASSNAME =
  "border-border/60 bg-muted/70 text-foreground supports-[backdrop-filter]:bg-muted/55 supports-[backdrop-filter]:backdrop-blur-sm"

export const WORKSPACE_TUTORIAL_PICKER_DARK_OUTLINE_SURFACE_CLASSNAME =
  "dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50 dark:data-[state=open]:bg-input/30 dark:data-[state=open]:text-foreground dark:[&_svg:not([class*='text-'])]:text-muted-foreground"

export const WORKSPACE_TUTORIAL_INVERSE_CONTROL_SURFACE_CLASSNAME =
  "border-transparent bg-foreground text-background shadow-md hover:bg-foreground data-[state=open]:bg-foreground data-[state=open]:text-background [&_svg:not([class*='text-'])]:text-background/70 dark:border-transparent dark:bg-white dark:text-slate-950 dark:hover:bg-white dark:data-[state=open]:bg-white dark:data-[state=open]:text-slate-950 dark:[&_svg:not([class*='text-'])]:text-slate-950/70"

export const WORKSPACE_TUTORIAL_OUTLINE_BUTTON_SURFACE_CLASSNAME =
  "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"

export const WORKSPACE_TUTORIAL_SHORTCUT_TOOLTIP_SURFACE_CLASSNAME =
  WORKSPACE_TUTORIAL_TOOLTIP_INVERSE_SURFACE_CLASSNAME

// Backward-compatible aliases while feature wrappers migrate to the explicit names.
export const WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME =
  WORKSPACE_TUTORIAL_TOOLTIP_INVERSE_SURFACE_CLASSNAME

export const WORKSPACE_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME =
  `${WORKSPACE_TUTORIAL_PICKER_LIGHT_SURFACE_CLASSNAME} ${WORKSPACE_TUTORIAL_PICKER_DARK_OUTLINE_SURFACE_CLASSNAME}`
