"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  BrandAssetId,
  BrandIdentityDraft,
  StoredBrandAsset,
} from "../types"
import {
  BRAND_IDENTITY_STORAGE_KEY,
  DEFAULT_BRAND_IDENTITY_DRAFT,
  sanitizeBrandDraft,
} from "../lib/brand-identity"
import {
  clearBrandAssets,
  loadBrandAssets,
  removeBrandAsset,
  saveBrandAsset,
} from "../lib/brand-identity-storage"

const MAX_ASSET_BYTES = 12 * 1024 * 1024

export function useBrandIdentityTool() {
  const [draft, setDraft] = useState(DEFAULT_BRAND_IDENTITY_DRAFT)
  const [assets, setAssets] = useState<StoredBrandAsset[]>([])
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState("Loading saved guide")

  useEffect(() => {
    let active = true
    const stored = window.localStorage.getItem(BRAND_IDENTITY_STORAGE_KEY)
    if (stored) {
      try {
        setDraft(sanitizeBrandDraft(JSON.parse(stored)))
      } catch {
        window.localStorage.removeItem(BRAND_IDENTITY_STORAGE_KEY)
      }
    }
    loadBrandAssets()
      .then((savedAssets) => {
        if (active) setAssets(savedAssets)
      })
      .catch(() =>
        setMessage("Text saves locally; asset storage is unavailable")
      )
      .finally(() => {
        if (!active) return
        setReady(true)
        setMessage("Saved on this device")
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(
      BRAND_IDENTITY_STORAGE_KEY,
      JSON.stringify(draft)
    )
    setMessage("Saved on this device")
  }, [draft, ready])

  const assetUrls = useMemo(() => {
    const entries = assets.map((asset) => [
      asset.id,
      URL.createObjectURL(asset.blob),
    ])
    return Object.fromEntries(entries) as Partial<Record<BrandAssetId, string>>
  }, [assets])

  useEffect(
    () => () => {
      for (const url of Object.values(assetUrls)) URL.revokeObjectURL(url)
    },
    [assetUrls]
  )

  const updateDraft = useCallback(
    (
      update:
        | Partial<BrandIdentityDraft>
        | ((current: BrandIdentityDraft) => BrandIdentityDraft)
    ) => {
      setMessage("Saving")
      setDraft((current) => {
        const next =
          typeof update === "function"
            ? update(current)
            : { ...current, ...update }
        return { ...next, updatedAt: new Date().toISOString() }
      })
    },
    []
  )

  const uploadAsset = useCallback(async (id: BrandAssetId, file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file")
      return false
    }
    if (file.size > MAX_ASSET_BYTES) {
      setMessage("Images must be 12 MB or smaller")
      return false
    }
    const asset: StoredBrandAsset = {
      id,
      name: file.name,
      type: file.type,
      blob: file,
      updatedAt: new Date().toISOString(),
    }
    try {
      await saveBrandAsset(asset)
      setAssets((current) => [
        ...current.filter((item) => item.id !== id),
        asset,
      ])
      setMessage("Saved on this device")
      return true
    } catch {
      setMessage("This browser could not save the image")
      return false
    }
  }, [])

  const deleteAsset = useCallback(async (id: BrandAssetId) => {
    await removeBrandAsset(id)
    setAssets((current) => current.filter((asset) => asset.id !== id))
  }, [])

  const reset = useCallback(async () => {
    window.localStorage.removeItem(BRAND_IDENTITY_STORAGE_KEY)
    await clearBrandAssets()
    setAssets([])
    setDraft(DEFAULT_BRAND_IDENTITY_DRAFT)
    setMessage("Started a fresh guide")
  }, [])

  return {
    draft,
    assets,
    assetUrls,
    ready,
    message,
    updateDraft,
    uploadAsset,
    deleteAsset,
    reset,
  }
}
