import type { PublicMapResourceTopLevelCategoryKey } from "./resource-categories"
import type { PublicMapResourceDeliveryMode } from "./resource-map-items"

export const SUPERADMIN_RESOURCE_SEED_CATEGORY_COPY = {
  health: {
    noun: "Health access",
    description: "Dummy health care and navigation marker for map preview.",
  },
  food: {
    noun: "Food access",
    description: "Dummy pantry and meal support marker for map preview.",
  },
  housing: {
    noun: "Housing support",
    description: "Dummy housing stability and shelter marker for map preview.",
  },
  education: {
    noun: "Education support",
    description: "Dummy education and learning resource marker for preview.",
  },
  employment: {
    noun: "Employment support",
    description: "Dummy employment and career support marker for preview.",
  },
  finance: {
    noun: "Finance support",
    description: "Dummy financial assistance and benefits marker for preview.",
  },
  legal: {
    noun: "Legal aid",
    description: "Dummy legal aid and rights support marker for preview.",
  },
  family: {
    noun: "Family support",
    description: "Dummy family and caregiver support marker for preview.",
  },
  community: {
    noun: "Community support",
    description: "Dummy mutual aid and community support marker for preview.",
  },
  emergency: {
    noun: "Crisis support",
    description: "Dummy crisis and disaster response marker for preview.",
  },
  environment: {
    noun: "Environmental support",
    description: "Dummy climate and environmental resource marker for preview.",
  },
  safety: {
    noun: "Safety support",
    description:
      "Dummy community safety and survivor support marker for preview.",
  },
  organizations: {
    noun: "Organization support",
    description: "Dummy capacity-building support marker for preview.",
  },
  international: {
    noun: "International support",
    description: "Dummy refugee and global aid marker for preview.",
  },
  animals: {
    noun: "Animal support",
    description: "Dummy animal welfare and pet support marker for preview.",
  },
} satisfies Record<
  PublicMapResourceTopLevelCategoryKey,
  { noun: string; description: string }
>

export const SUPERADMIN_RESOURCE_SEED_DELIVERY_MODES = {
  health: ["in_person", "phone"],
  food: ["in_person"],
  housing: ["in_person", "phone"],
  education: ["online", "hybrid"],
  employment: ["hybrid"],
  finance: ["hybrid", "phone"],
  legal: ["hybrid", "phone"],
  family: ["hybrid", "phone"],
  community: ["hybrid"],
  emergency: ["in_person", "phone", "mobile"],
  environment: ["hybrid"],
  safety: ["in_person", "phone", "mobile"],
  organizations: ["online", "hybrid"],
  international: ["online", "phone"],
  animals: ["in_person", "phone"],
} satisfies Record<
  PublicMapResourceTopLevelCategoryKey,
  PublicMapResourceDeliveryMode[]
>
