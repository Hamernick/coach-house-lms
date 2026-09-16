import { expect, test } from "@playwright/test"

test("Brand Identity keeps uploads independent and persists them through reload", async ({
  page,
}) => {
  // Every test gets a fresh browser context; no account or existing kit is changed.
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9p8AAAAASUVORK5CYII=",
    "base64"
  )
  const fixture = (name: string) => ({
    name,
    mimeType: "image/png",
    buffer: image,
  })
  await page.goto("/documentation/tools/brand-identity")
  const downloadZip = page.getByRole("button", { name: "Download ZIP", exact: true })
  await expect(downloadZip).toBeEnabled()
  await page.getByLabel("Primary logo file", { exact: true }).setInputFiles(
    fixture("logo-canary.png")
  )
  await expect(page.getByRole("button", { name: "Replace primary logo", exact: true })).toBeEnabled()
  await page.getByLabel("Illustration 01 file", { exact: true }).setInputFiles(
    fixture("illustration-canary.png")
  )
  await expect(page.getByRole("button", { name: "Replace illustration 01", exact: true })).toBeEnabled()
  await expect(page.getByText("2 files", { exact: true })).toBeVisible()

  await page.reload()
  await expect(downloadZip).toBeEnabled()
  for (const name of ["primary logo", "illustration 01"]) {
    await expect(page.getByRole("button", { name: `Replace ${name}`, exact: true })).toBeEnabled()
  }
  for (const name of ["Primary logo preview", "Illustration 01 preview"]) {
    await expect.poll(() => page.getByAltText(name, { exact: true }).evaluate(
      (element) => (element as HTMLImageElement).naturalWidth
    )).toBe(1)
  }
  await expect(page.getByRole("button", { name: "Upload brand mark", exact: true })).toBeEnabled()
  await expect(page.getByText("2 files", { exact: true })).toBeVisible()

  const downloaded = page.waitForEvent("download")
  await downloadZip.click()
  expect((await downloaded).suggestedFilename()).toMatch(/\.zip$/)

  await page.getByRole("button", { name: "Remove primary logo", exact: true }).click()
  await expect(page.getByText("1 files", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("button", { name: "Upload primary logo", exact: true })).toBeEnabled()
  await expect(page.getByRole("button", { name: "Replace illustration 01", exact: true })).toBeEnabled()
  await expect(page.getByText("1 files", { exact: true })).toBeVisible()
})
