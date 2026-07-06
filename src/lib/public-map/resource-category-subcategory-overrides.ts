import type {
  PublicMapResourceCategoryDefinition,
  PublicMapResourceSubcategoryKey,
} from "./resource-categories"

type PublicMapResourceSubcategoryDefinitionOverride = Partial<
  Pick<
    PublicMapResourceCategoryDefinition,
    "aliases" | "description" | "iconName" | "markerColor" | "tailwindToken"
  >
>

export const PUBLIC_MAP_RESOURCE_SUBCATEGORY_DEFINITION_OVERRIDES: Partial<
  Record<
    PublicMapResourceSubcategoryKey,
    PublicMapResourceSubcategoryDefinitionOverride
  >
> = {
  food_community_fridges: {
    aliases: ["community fridge", "free fridge", "freedge", "friendly fridge"],
    description: "Community fridges and mutual-aid food.",
    iconName: "bread",
    markerColor: "#0891b2",
    tailwindToken: "cyan-600",
  },
  emergency_cooling_centers: {
    aliases: ["cooling center", "cooling site", "heat relief"],
    description: "Cooling centers, heat relief, and hydration locations.",
    iconName: "wind",
    markerColor: "#0284c7",
    tailwindToken: "sky-600",
  },
}
