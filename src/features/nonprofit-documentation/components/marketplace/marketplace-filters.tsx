"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  DEFAULT_MARKETPLACE_FILTERS,
  MARKETPLACE_COST_MODELS,
  MARKETPLACE_FUNCTIONS,
  MARKETPLACE_RESOURCE_TYPES,
  MARKETPLACE_STAGES,
} from "../../lib/marketplace-directory"
import type { MarketplaceFilters } from "../../marketplace-types"

type FilterKey = Exclude<keyof MarketplaceFilters, "query">

function MarketplaceSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="min-h-11 w-full sm:min-h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All {label.toLocaleLowerCase()}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

export function MarketplaceFiltersPanel({
  filters,
  onChange,
}: {
  filters: MarketplaceFilters
  onChange: (filters: MarketplaceFilters) => void
}) {
  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== DEFAULT_MARKETPLACE_FILTERS[key as keyof MarketplaceFilters]
  )
  const update = (key: FilterKey, value: string) =>
    onChange({ ...filters, [key]: value } as MarketplaceFilters)

  return (
    <div className="grid gap-4" aria-label="Marketplace filters">
      <Field>
        <FieldLabel htmlFor="marketplace-search">Search resources</FieldLabel>
        <div className="relative">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="marketplace-search"
            type="search"
            value={filters.query}
            maxLength={100}
            autoComplete="off"
            placeholder="Search provider, purpose, or need"
            className="min-h-11 pl-9 text-sm sm:min-h-9 sm:text-sm"
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
          />
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MarketplaceSelect
          id="marketplace-type"
          label="Types"
          value={filters.type}
          options={MARKETPLACE_RESOURCE_TYPES}
          onChange={(value) => update("type", value)}
        />
        <MarketplaceSelect
          id="marketplace-function"
          label="Functions"
          value={filters.function}
          options={MARKETPLACE_FUNCTIONS}
          onChange={(value) => update("function", value)}
        />
        <MarketplaceSelect
          id="marketplace-stage"
          label="Stages"
          value={filters.stage}
          options={MARKETPLACE_STAGES}
          onChange={(value) => update("stage", value)}
        />
        <MarketplaceSelect
          id="marketplace-cost"
          label="Access models"
          value={filters.cost}
          options={MARKETPLACE_COST_MODELS}
          onChange={(value) => update("cost", value)}
        />
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-fit px-2 sm:min-h-9"
          onClick={() => onChange(DEFAULT_MARKETPLACE_FILTERS)}
        >
          <XIcon data-icon="inline-start" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
