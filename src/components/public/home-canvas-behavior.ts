export type CanvasSectionBehavior = {
  scrollable: boolean
  touchAction: "pan-x" | "pan-y"
}

export function resolveCanvasSectionBehavior(sectionId: string): CanvasSectionBehavior {
  const scrollable = sectionId === "pricing" || sectionId === "accelerator"
  return {
    scrollable,
    touchAction: scrollable ? "pan-y" : "pan-x",
  }
}
