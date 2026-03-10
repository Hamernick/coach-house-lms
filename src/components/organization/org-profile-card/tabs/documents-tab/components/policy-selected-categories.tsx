"use client"

import XIcon from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type PolicySelectedCategoriesProps = {
  selectedCategories: string[]
  onRemoveCategory: (category: string) => void
}

export function PolicySelectedCategories({
  selectedCategories,
  onRemoveCategory,
}: PolicySelectedCategoriesProps) {
  if (selectedCategories.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Add one or more categories so this policy is easier to find later.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {selectedCategories.map((category) => (
        <Badge key={category} variant="outline" className="gap-1 pl-2">
          {category}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-sm p-0 hover:bg-muted"
            onClick={() => onRemoveCategory(category)}
            aria-label={`Remove ${category}`}
          >
            <XIcon className="h-3 w-3" aria-hidden />
          </Button>
        </Badge>
      ))}
    </div>
  )
}
