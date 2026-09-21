"use client"

// Blob downloads avoid opening async popups, which browsers block in batches.
export async function downloadFile(url: string, name: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Unable to download file. Try again.")
  const objectUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
