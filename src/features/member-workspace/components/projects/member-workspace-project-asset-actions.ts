"use client"

import { useCallback } from "react"

import {
  createProjectAssets,
  deleteProjectAsset,
  updateProjectAsset,
} from "./project-assets-api"

async function uploadAssetsForProject({
  input,
  projectId,
}: {
  input: {
    title?: string
    description?: string
    link?: string
    files: File[]
  }
  projectId: string
}) {
  return createProjectAssets({
    projectId,
    title: input.title,
    description: input.description,
    link: input.link,
    files: input.files,
  })
}

export function useProjectAssetActions({
  canManageProject,
  projectId,
}: {
  canManageProject: boolean
  projectId: string
}) {
  const handleCreateAsset = useCallback(
    async (input: {
      title?: string
      description?: string
      link?: string
      files: File[]
    }) => {
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await uploadAssetsForProject({
        input,
        projectId,
      })
    },
    [canManageProject, projectId]
  )

  const handleUploadNoteAssets = useCallback(
    async (input: { title?: string; description?: string; files: File[] }) => {
      if (!canManageProject) {
        throw new Error("Note uploads are unavailable.")
      }

      const response = await uploadAssetsForProject({
        input,
        projectId,
      })

      return response.assets
    },
    [canManageProject, projectId]
  )

  const handleUpdateAsset = useCallback(
    async (
      assetId: string,
      input: {
        title?: string
        description?: string
        link?: string
        files: File[]
      }
    ) => {
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await updateProjectAsset({
        projectId,
        assetId,
        name: input.title?.trim() || "Untitled asset",
        description: input.description,
        link: input.link,
      })
    },
    [canManageProject, projectId]
  )

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      if (!canManageProject) {
        throw new Error("Asset editing is unavailable.")
      }

      await deleteProjectAsset({
        projectId,
        assetId,
      })
    },
    [canManageProject, projectId]
  )

  return {
    handleCreateAsset,
    handleUploadNoteAssets,
    handleUpdateAsset,
    handleDeleteAsset,
  }
}
