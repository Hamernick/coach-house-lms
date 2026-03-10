"use client"

import ArrowDown from "lucide-react/dist/esm/icons/arrow-down"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

type PolicyCategoriesDropdownProps = {
  selectedCategories: string[]
  availableCategories: string[]
  categoryInput: string
  normalizedCategoryInput: string
  onCategoryInputChange: (value: string) => void
  onToggleCategory: (category: string) => void
  onCreateCategory: (category: string) => void
}

export function PolicyCategoriesDropdown({
  selectedCategories,
  availableCategories,
  categoryInput,
  normalizedCategoryInput,
  onCategoryInputChange,
  onToggleCategory,
  onCreateCategory,
}: PolicyCategoriesDropdownProps) {
  const handleCreateCategory = () => {
    if (normalizedCategoryInput.length === 0) return
    onCreateCategory(normalizedCategoryInput)
    onCategoryInputChange("")
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between text-left"
        >
          <span className="truncate">
            {selectedCategories.length > 0
              ? `${selectedCategories.length} selected`
              : "Select categories"}
          </span>
          <ArrowDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(26rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-52 overflow-y-auto p-1">
          {availableCategories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => onToggleCategory(category)}
              onSelect={(event) => event.preventDefault()}
            >
              {category}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-2">
          <Input
            value={categoryInput}
            onChange={(event) => onCategoryInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              handleCreateCategory()
            }}
            placeholder="Create custom category…"
            className="h-9"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-full"
            disabled={normalizedCategoryInput.length === 0}
            onClick={handleCreateCategory}
          >
            Add category
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
