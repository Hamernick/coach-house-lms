"use client"

async function getErrorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}))
  return payload?.error || fallback
}

export async function createProjectAssets(input: {
  projectId: string
  title?: string
  description?: string
  link?: string
  files: File[]
}) {
  const form = new FormData()
  form.append("projectId", input.projectId)
  if (input.title) {
    form.append("title", input.title)
  }
  if (input.description) {
    form.append("description", input.description)
  }
  if (input.link) {
    form.append("link", input.link)
  }
  for (const file of input.files) {
    form.append("files", file)
  }

  const response = await fetch("/api/account/project-assets", {
    method: "POST",
    body: form,
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to save assets."))
  }

  return response.json()
}

export async function updateProjectAsset(input: {
  projectId: string
  assetId: string
  name: string
  description?: string
  link?: string
}) {
  const response = await fetch("/api/account/project-assets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to update asset."))
  }

  return response.json()
}

export async function deleteProjectAsset(input: {
  projectId: string
  assetId: string
}) {
  const response = await fetch("/api/account/project-assets", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to delete asset."))
  }

  return response.json()
}
