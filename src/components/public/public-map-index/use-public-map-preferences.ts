"use client"

import { useEffect, useRef, useState } from "react"

import {
  FAVORITES_STORAGE_KEY,
  RECENT_ORGANIZATIONS_STORAGE_KEY,
  SAVED_QUERIES_STORAGE_KEY,
  type PreferenceMode,
} from "./constants"
import {
  isRecord,
  mergeUniqueStrings,
  normalizeStringArray,
  readStoredArray,
  stringArraysEqual,
  type PublicMapPreferences,
} from "./helpers"

type PublicMapViewer = { id: string; email: string | null } | null

type UsePublicMapPreferencesOptions = {
  initialViewer?: PublicMapViewer
}

export function canLoadRemotePublicMapPreferences(viewer: PublicMapViewer) {
  return Boolean(viewer?.id)
}

export function usePublicMapPreferences({
  initialViewer = null,
}: UsePublicMapPreferencesOptions = {}) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [savedQueries, setSavedQueries] = useState<string[]>([])
  const [recentOrganizationIds, setRecentOrganizationIds] = useState<string[]>([])
  const [preferenceMode, setPreferenceMode] = useState<PreferenceMode>("unknown")
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [preferencesSaveError, setPreferencesSaveError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<PublicMapViewer>(initialViewer)

  const shouldSkipRemoteSyncRef = useRef(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const localFavorites = readStoredArray(FAVORITES_STORAGE_KEY, 120)
    const localSavedQueries = readStoredArray(SAVED_QUERIES_STORAGE_KEY, 40)
    const localRecentOrganizationIds = readStoredArray(
      RECENT_ORGANIZATIONS_STORAGE_KEY,
      40,
    )
    setFavorites(localFavorites)
    setSavedQueries(localSavedQueries)
    setRecentOrganizationIds(localRecentOrganizationIds)
    setPreferenceMode("guest")
    setViewer(initialViewer)

    if (!canLoadRemotePublicMapPreferences(initialViewer)) {
      shouldSkipRemoteSyncRef.current = true
      return
    }

    let cancelled = false

    async function loadPreferences() {
      try {
        const response = await fetch("/api/account/map-preferences", {
          method: "GET",
          cache: "no-store",
        })

        if (response.status === 401) {
          if (!cancelled) {
            setPreferenceMode("guest")
            setViewer(null)
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Unable to load map preferences (${response.status})`)
        }

        const payload = (await response.json().catch(() => ({}))) as unknown
        const preferences = isRecord(payload) && isRecord(payload.preferences) ? payload.preferences : {}
        const nextFavorites = normalizeStringArray(preferences.favorites, 120)
        const nextSavedQueries = normalizeStringArray(preferences.savedQueries, 40)
        const nextRecentOrganizationIds = normalizeStringArray(
          preferences.recentOrganizationIds,
          40,
        )
        const mergedFavorites = mergeUniqueStrings(nextFavorites, localFavorites, 120)
        const mergedSavedQueries = mergeUniqueStrings(nextSavedQueries, localSavedQueries, 40)
        const mergedRecentOrganizationIds = mergeUniqueStrings(
          nextRecentOrganizationIds,
          localRecentOrganizationIds,
          40,
        )
        const shouldSyncMergedPreferences =
          !stringArraysEqual(mergedFavorites, nextFavorites) ||
          !stringArraysEqual(mergedSavedQueries, nextSavedQueries) ||
          !stringArraysEqual(
            mergedRecentOrganizationIds,
            nextRecentOrganizationIds,
          )

        if (!cancelled) {
          shouldSkipRemoteSyncRef.current = !shouldSyncMergedPreferences
          setFavorites(mergedFavorites)
          setSavedQueries(mergedSavedQueries)
          setRecentOrganizationIds(mergedRecentOrganizationIds)
          setPreferenceMode("authenticated")
          setPreferencesSaveError(null)
          setViewer(
            isRecord(payload) && isRecord(payload.user)
              ? {
                  id:
                    typeof payload.user.id === "string"
                      ? payload.user.id
                      : "",
                  email:
                    typeof payload.user.email === "string"
                      ? payload.user.email
                      : null,
                }
              : null,
          )
        }
      } catch (error) {
        console.error("Map preferences load failed:", error)
        if (!cancelled) setPreferenceMode("guest")
      }
    }

    void loadPreferences()

    return () => {
      cancelled = true
    }
  }, [initialViewer])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (preferenceMode === "authenticated") return
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    window.localStorage.setItem(SAVED_QUERIES_STORAGE_KEY, JSON.stringify(savedQueries))
    window.localStorage.setItem(
      RECENT_ORGANIZATIONS_STORAGE_KEY,
      JSON.stringify(recentOrganizationIds),
    )
  }, [favorites, preferenceMode, recentOrganizationIds, savedQueries])

  useEffect(() => {
    if (preferenceMode !== "authenticated") return

    if (shouldSkipRemoteSyncRef.current) {
      shouldSkipRemoteSyncRef.current = false
      return
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          setIsSavingPreferences(true)
          setPreferencesSaveError(null)
          const response = await fetch("/api/account/map-preferences", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              favorites,
              savedQueries,
              recentOrganizationIds,
            } satisfies PublicMapPreferences),
          })

          if (!response.ok) {
            throw new Error(`Unable to save map preferences (${response.status})`)
          }
        } catch (error) {
          console.error("Map preferences save failed:", error)
          setPreferencesSaveError("Could not sync preferences.")
        } finally {
          setIsSavingPreferences(false)
        }
      })()
    }, 320)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [favorites, preferenceMode, recentOrganizationIds, savedQueries])

  return {
    favorites,
    savedQueries,
    recentOrganizationIds,
    preferenceMode,
    isSavingPreferences,
    preferencesSaveError,
    viewer,
    setFavorites,
    setSavedQueries,
    setRecentOrganizationIds,
  }
}
