"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { PublicProfileSavedItem } from "../types"

export type PublicSavedCollectionDraft = {
  id: string | null
  name: string
  isPublic: boolean
  itemKeys: string[]
}

export function savedItemKey(
  item: Pick<PublicProfileSavedItem, "kind" | "id">
) {
  return `${item.kind}:${item.id}`
}

export function PublicProfileSavedCollectionEditor({
  availableItems,
  draft,
  saving,
  onCancel,
  onChange,
  onSave,
}: {
  availableItems: PublicProfileSavedItem[]
  draft: PublicSavedCollectionDraft
  saving: boolean
  onCancel: () => void
  onChange: (draft: PublicSavedCollectionDraft) => void
  onSave: () => void
}) {
  const selected = new Set(draft.itemKeys)

  return (
    <div className="space-y-5 border-t pt-5">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="public-saved-collection-name">Collection name</Label>
          <Input
            id="public-saved-collection-name"
            value={draft.name}
            maxLength={60}
            placeholder="Neighborhood essentials"
            disabled={saving}
            onChange={(event) =>
              onChange({ ...draft, name: event.currentTarget.value })
            }
          />
        </div>
        <div className="flex min-h-10 items-center gap-3">
          <Switch
            id="public-saved-collection-visibility"
            checked={draft.isPublic}
            disabled={saving}
            onCheckedChange={(isPublic) => onChange({ ...draft, isPublic })}
          />
          <Label htmlFor="public-saved-collection-visibility">
            Show on profile
          </Label>
        </div>
      </div>

      <fieldset className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <legend className="text-sm font-medium">Saved Find items</legend>
          <span className="text-muted-foreground text-xs tabular-nums">
            {draft.itemKeys.length}/24 selected
          </span>
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border p-2">
          {availableItems.map((item) => {
            const key = savedItemKey(item)
            const checked = selected.has(key)
            const checkboxId = `public-saved-item-${encodeURIComponent(key)}`
            return (
              <Label
                key={key}
                htmlFor={checkboxId}
                className="hover:bg-muted/50 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  disabled={saving || (!checked && selected.size >= 24)}
                  onCheckedChange={(nextChecked) => {
                    onChange({
                      ...draft,
                      itemKeys: nextChecked
                        ? [...draft.itemKeys, key]
                        : draft.itemKeys.filter(
                            (candidate) => candidate !== key
                          ),
                    })
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  {item.locationLabel || item.subtitle ? (
                    <span className="text-muted-foreground block truncate text-xs">
                      {item.locationLabel ?? item.subtitle}
                    </span>
                  ) : null}
                </span>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {item.kind}
                </Badge>
              </Label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={saving || !draft.name.trim() || draft.itemKeys.length === 0}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save collection"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
