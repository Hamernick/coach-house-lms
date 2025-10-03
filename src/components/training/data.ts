import type { ClassDef } from "./types"

export const CLASSES: ClassDef[] = [
  {
    id: "class-1",
    title: "Class 1",
    blurb: "Foundations overview, outcomes, prerequisites.",
    slug: "foundations",
    modules: [
      { id: "c1-m1", title: "Module 1", subtitle: "Intro & goals" },
      { id: "c1-m2", title: "Module 2", subtitle: "Core concepts" },
      { id: "c1-m3", title: "Module 3", subtitle: "Practice & recap" },
    ],
  },
  {
    id: "class-2",
    title: "Class 2",
    blurb: "Intermediate topics & projects.",
    slug: "intermediate",
    modules: [
      { id: "c2-m1", title: "Module 1", subtitle: "Setup & patterns" },
      { id: "c2-m2", title: "Module 2", subtitle: "System design" },
      { id: "c2-m3", title: "Module 3", subtitle: "Capstone prep" },
    ],
  },
]
