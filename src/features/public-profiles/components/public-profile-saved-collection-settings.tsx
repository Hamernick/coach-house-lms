"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PublicProfileSavedItem } from "../types"
import {
  PublicProfileSavedCollectionEditor,
  savedItemKey,
  type PublicSavedCollectionDraft,
} from "./public-profile-saved-collection-editor"

type AccountSavedCollection = {
  id: string
  name: string
  isPublic: boolean
  items: Array<Pick<PublicProfileSavedItem, "kind" | "id">>
}

type SavedCollectionResponse = {
  availableItems?: PublicProfileSavedItem[]
  collections?: AccountSavedCollection[]
  error?: string
}

const NEW_COLLECTION: PublicSavedCollectionDraft = {
  id: null,
  name: "",
  isPublic: true,
  itemKeys: [],
}

export function PublicProfileSavedCollectionSettings() {
  const [availableItems, setAvailableItems] = useState<
    PublicProfileSavedItem[]
  >([])
  const [collections, setCollections] = useState<AccountSavedCollection[]>([])
  const [draft, setDraft] = useState<PublicSavedCollectionDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCollections = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/account/public-saved-collections")
      const result = (await response.json()) as SavedCollectionResponse
      if (!response.ok || !result.availableItems || !result.collections) {
        throw new Error(result.error ?? "Unable to load saved collections.")
      }
      setAvailableItems(result.availableItems)
      setCollections(result.collections)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load saved collections."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  function editCollection(collection: AccountSavedCollection) {
    setDraft({
      id: collection.id,
      name: collection.name,
      isPublic: collection.isPublic,
      itemKeys: collection.items.map(savedItemKey),
    })
  }

  async function saveCollection() {
    if (!draft) return
    const itemByKey = new Map(
      availableItems.map((item) => [savedItemKey(item), item])
    )
    const items = draft.itemKeys.flatMap((key) => {
      const item = itemByKey.get(key)
      return item ? [{ kind: item.kind, id: item.id }] : []
    })
    setSaving(true)
    try {
      const response = await fetch("/api/account/public-saved-collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collectionId: draft.id,
          name: draft.name,
          isPublic: draft.isPublic,
          items,
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save this collection.")
      }
      setDraft(null)
      await loadCollections()
      toast.success(
        draft.isPublic
          ? "Collection published on your profile."
          : "Private collection saved."
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save collection."
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCollection(collectionId: string) {
    setDeletingId(collectionId)
    try {
      const response = await fetch("/api/account/public-saved-collections", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectionId }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete this collection.")
      }
      setCollections((current) =>
        current.filter((collection) => collection.id !== collectionId)
      )
      if (draft?.id === collectionId) setDraft(null)
      toast.success("Collection deleted.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete collection."
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section
      aria-labelledby="public-saved-collections-heading"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id="public-saved-collections-heading"
            className="text-sm font-medium"
          >
            Public saved collections
          </h3>
          <p className="text-muted-foreground max-w-xl text-sm leading-6">
            Group resources already saved in Find. Only collections you mark
            public appear on your profile; personal map preferences stay
            private.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            loading || availableItems.length === 0 || collections.length >= 12
          }
          onClick={() => setDraft({ ...NEW_COLLECTION })}
        >
          Add collection
        </Button>
      </div>

      {loading ? (
        <div aria-label="Loading saved collections" className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="border-destructive/30 space-y-3 rounded-xl border p-4"
        >
          <p className="text-destructive text-sm">{loadError}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={loadCollections}
          >
            Try again
          </Button>
        </div>
      ) : availableItems.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm leading-6">
          Save an organization or resource in Find before creating a public
          collection.
        </p>
      ) : (
        <div className="space-y-2">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex min-h-16 items-center gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {collection.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {collection.items.length}{" "}
                  {collection.items.length === 1 ? "item" : "items"}
                </p>
              </div>
              <Badge variant={collection.isPublic ? "default" : "secondary"}>
                {collection.isPublic ? "Public" : "Private"}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => editCollection(collection)}
              >
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === collection.id}
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {collection.name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the collection from your account and public
                      profile. Your original Find saves remain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void deleteCollection(collection.id)}
                    >
                      Delete collection
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {collections.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
              Your Find saves are private until you add a collection.
            </p>
          ) : null}
        </div>
      )}

      {draft && availableItems.length > 0 ? (
        <PublicProfileSavedCollectionEditor
          availableItems={availableItems}
          draft={draft}
          saving={saving}
          onCancel={() => setDraft(null)}
          onChange={setDraft}
          onSave={() => void saveCollection()}
        />
      ) : null}
    </section>
  )
}
