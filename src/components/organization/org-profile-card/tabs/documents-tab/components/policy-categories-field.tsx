"use client"

import { useEffect, useMemo, useState } from "react"

import { Label } from "@/components/ui/label"

import { POLICY_CATEGORY_PRESETS } from "../constants"
import { normalizeCategories } from "../helpers"
import { PolicyCategoriesDropdown } from "./policy-categories-dropdown"
import { PolicySelectedCategories } from "./policy-selected-categories"

type PolicyCategoriesFieldProps = {
  open: boolean
  selectedCategories: string[]
  categoryOptions: string[]
  onToggleCategory: (category: string) => void
  onCreateCategory: (category: string) => void
  onRemoveCategory: (category: string) => void
}

export function PolicyCategoriesField({
  open,
  selectedCategories,
  categoryOptions,
  onToggleCategory,
  onCreateCategory,
  onRemoveCategory,
}: PolicyCategoriesFieldProps) {
  const [categoryInput, setCategoryInput] = useState("")

  useEffect(() => {
    if (!open) setCategoryInput("")
  }, [open])

  const normalizedCategoryInput = categoryInput.trim()
  const availablePolicyCategories = useMemo(
    () =>
      normalizeCategories([
        ...POLICY_CATEGORY_PRESETS,
        ...categoryOptions,
        ...selectedCategories,
      ]),
    [categoryOptions, selectedCategories],
  )

  return (
    <div className="grid gap-2">
      <Label>Policy categories</Label>
      <div className="rounded-lg border border-border/60 p-3">
        <PolicyCategoriesDropdown
          selectedCategories={selectedCategories}
          availableCategories={availablePolicyCategories}
          categoryInput={categoryInput}
          normalizedCategoryInput={normalizedCategoryInput}
          onCategoryInputChange={setCategoryInput}
          onToggleCategory={onToggleCategory}
          onCreateCategory={onCreateCategory}
        />

        <PolicySelectedCategories
          selectedCategories={selectedCategories}
          onRemoveCategory={onRemoveCategory}
        />
      </div>
    </div>
  )
}
