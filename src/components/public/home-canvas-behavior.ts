export type CanvasSectionBehavior = {
  scrollable: boolean
  touchAction: "auto" | "pan-x" | "pan-y"
  lockNavigationGestures: boolean
}

export function resolveCanvasSectionBehavior(
  sectionId: string
): CanvasSectionBehavior {
  const isMapSection = sectionId === "find"
  const scrollable =
    sectionId === "pricing" ||
    sectionId === "accelerator" ||
    sectionId === "login" ||
    sectionId === "signup"
  return {
    scrollable,
    touchAction: isMapSection ? "auto" : scrollable ? "pan-y" : "pan-x",
    lockNavigationGestures: isMapSection,
  }
}
