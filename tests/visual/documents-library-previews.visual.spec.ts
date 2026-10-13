import { expect, test, type Page } from "@playwright/test"
import { PDFDocument, rgb } from "pdf-lib"

const IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64"
)

function card(page: Page, name: string) {
  return page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
}

async function openPreviews(page: Page, failPreview = false) {
  const pdf = await PDFDocument.create()
  pdf.addPage([300, 400]).drawText("Bylaws preview", {
    x: 30,
    y: 330,
    size: 24,
    color: rgb(0, 0, 0),
  })
  pdf.addPage([300, 400]).drawText("Second page", { x: 30, y: 330, size: 24 })
  const pdfBytes = Buffer.from(await pdf.save())
  const uploads: string[] = []
  let generalUploads = 0
  const coreUploads: string[] = []
  const coreFiles: Array<{
    id: string
    name: string
    coreSectionId: string
    mimeType: string
    sizeBytes: number
    createdAt: string
    updatedAt: string
    deletedAt: null
  }> = []
  await page.route("**/api/integrations/google-drive/**", (route) =>
    route.fulfill({ json: { connection: { connected: false }, documents: [] } })
  )
  await page.route("**/documents-preview-fixture.png", (route) =>
    route.fulfill({ body: IMAGE, contentType: "image/png" })
  )
  await page.route("**/documents-preview-fixture.pdf", (route) =>
    route.fulfill({ body: pdfBytes, contentType: "application/pdf" })
  )
  await page.route("**/api/account/organization-document-files**", (route) => {
    if (route.request().method() === "POST") {
      const sectionId = route
        .request()
        .postDataBuffer()
        ?.toString()
        .match(/name="coreSectionId"\r\n\r\n([^\r]+)/)?.[1]
      if (!sectionId) {
        generalUploads += 1
        return route.fulfill({ status: 400, json: { error: "Missing slot" } })
      }
      coreUploads.push(sectionId)
      const file = {
        id: `core-${sectionId}`,
        coreSectionId: sectionId,
        name: "bylaws.png",
        mimeType: "image/png",
        sizeBytes: 100,
        createdAt: "2026-09-08T12:00:00Z",
        updatedAt: "2026-09-08T12:00:00Z",
        deletedAt: null,
      }
      coreFiles.unshift(file)
      return route.fulfill({ json: { file } })
    }
    const url = new URL(route.request().url())
    if (url.searchParams.has("id")) {
      if (failPreview)
        return route.fulfill({ status: 403, json: { error: "Forbidden" } })
      return route.fulfill({
        json: {
          url: new URL(
            `/documents-preview-fixture.${url.searchParams.get("id")?.startsWith("core-") ? "png" : url.searchParams.get("id")}`,
            url.origin
          ).href,
        },
      })
    }
    return route.fulfill({
      json: {
        files: [
          ...coreFiles,
          ...["png", "pdf"].map((type) => ({
            id: type,
            name: `Uploaded ${type}`,
            mimeType: type === "png" ? "image/png" : "application/pdf",
            sizeBytes: 100,
            createdAt: "2026-09-08T12:00:00Z",
            updatedAt: "2026-09-08T12:00:00Z",
            deletedAt: null,
          })),
        ],
        quota: { usedBytes: 200, limitBytes: 5368709120 },
      },
    })
  })
  await page.route("**/api/account/org-documents?**", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === "POST") {
      uploads.push(url.searchParams.get("kind")!)
      expect(request.postDataBuffer()?.toString()).toContain(
        'filename="bylaws.png"'
      )
      return route.fulfill({
        json: {
          document: {
            name: "bylaws.png",
            path: "fixture/bylaws/bylaws.png",
            mime: "image/png",
            size: IMAGE.length,
            updatedAt: "2026-09-08T12:00:00Z",
          },
        },
      })
    }
    return route.fulfill({
      json: { url: new URL("/documents-preview-fixture.png", url.origin).href },
    })
  })
  await page.goto("/visual-regression/documents-banner")
  await expect(card(page, "Uploaded png")).toBeVisible()
  return {
    uploads,
    coreUploads,
    generalUploadCount: () => generalUploads,
    allowPreview: () => {
      failPreview = false
    },
  }
}

async function slotTransfer(page: Page, count = 1) {
  return page.evaluateHandle(
    ({ bytes, count }) => {
      const transfer = new DataTransfer()
      for (let index = 0; index < count; index += 1) {
        transfer.items.add(
          new File([new Uint8Array(bytes)], "bylaws.png", {
            type: "image/png",
          })
        )
      }
      return transfer
    },
    { bytes: [...IMAGE], count }
  )
}

for (const view of ["Grid", "List"]) {
  test(`${view} empty drop zones upload only to the target slot`, async ({
    page,
  }) => {
    const fixture = await openPreviews(page)
    await page
      .getByRole("button", { name: `${view} view`, exact: true })
      .click()
    const bylaws = card(page, "Bylaws")
    const target = bylaws.getByRole("button", {
      name: "Upload Bylaws",
      exact: true,
    })
    const transfer = await slotTransfer(page)
    const banner = page.locator(
      '[data-react-grab-owner-id="organization-documents:banner"]'
    )
    await bylaws.scrollIntoViewIfNeeded()
    await banner.dispatchEvent("dragenter", { dataTransfer: transfer })
    await expect(banner).not.toHaveAttribute("data-dragging-files")
    await expect(page.getByText("Drop files to upload")).toHaveCount(0)
    expect(
      await bylaws.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return (
          document
            .elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            )
            ?.closest("article") === element
        )
      })
    ).toBe(true)
    await target.dispatchEvent("dragenter", { dataTransfer: transfer })
    await expect(banner).not.toHaveAttribute("data-dragging-files")
    await expect(bylaws).toHaveAttribute("data-dragging-file", "true")
    await target.dispatchEvent("dragleave", { dataTransfer: transfer })
    await expect(bylaws).not.toHaveAttribute("data-dragging-file")
    expect(fixture.uploads).toEqual([])
    await target.dispatchEvent("dragenter", { dataTransfer: transfer })
    await target.dispatchEvent("drop", { dataTransfer: transfer })
    await expect.poll(() => fixture.uploads).toEqual(["bylaws"])
    await expect(
      bylaws.getByRole("img", { name: "Bylaws preview" })
    ).toBeVisible()
    await expect(bylaws).not.toHaveAttribute("data-document-dropzone")
    await expect(card(page, "W-9 form")).toHaveAttribute(
      "data-document-dropzone",
      "true"
    )
    expect(fixture.generalUploadCount()).toBe(0)
  })
}

test("a document slot rejects multiple files without falling through to the library", async ({
  page,
}) => {
  const fixture = await openPreviews(page)
  const bylaws = card(page, "Bylaws")
  await bylaws.dispatchEvent("drop", {
    dataTransfer: await slotTransfer(page, 2),
  })
  await expect(
    page.getByText("Drop one file into this document slot.")
  ).toBeVisible()
  expect(fixture.uploads).toEqual([])
  expect(fixture.generalUploadCount()).toBe(0)
  await expect(bylaws).not.toHaveAttribute("data-dragging-file")
})

test("empty slots upload to the selected kind, then show an image and preview", async ({
  page,
}) => {
  const fixture = await openPreviews(page)
  const bylaws = card(page, "Bylaws")
  await expect(bylaws.locator(".tabular-nums")).toHaveCount(0)
  const chooser = page.waitForEvent("filechooser")
  await bylaws
    .getByRole("button", { name: "Upload Bylaws", exact: true })
    .click()
  await (
    await chooser
  ).setFiles({ name: "bylaws.png", mimeType: "image/png", buffer: IMAGE })
  await expect.poll(() => fixture.uploads).toEqual(["bylaws"])
  await expect(
    bylaws.getByRole("img", { name: "Bylaws preview" })
  ).toBeVisible()
  await expect(bylaws.locator(".tabular-nums")).toHaveText("Sep 8")
  await bylaws.getByRole("button", { name: "Open Bylaws", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Bylaws" })
  await expect(
    dialog.getByRole("img", { name: "Bylaws", exact: true })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(
    bylaws.getByRole("button", { name: "Open Bylaws", exact: true })
  ).toBeFocused()
})

test("PDF cards render the first page and open an embedded preview", async ({
  page,
}) => {
  await openPreviews(page)
  const pdf = card(page, "Uploaded pdf")
  await expect(pdf.locator("canvas")).toHaveAttribute(
    "data-preview-ready",
    "true"
  )
  await pdf
    .getByRole("button", { name: "Open Uploaded pdf", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "Uploaded pdf" })
  await expect(dialog.locator("canvas")).toHaveAttribute(
    "data-preview-page",
    "1"
  )
  expect(
    await dialog.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data
      return pixels.some((value, index) => index % 4 !== 3 && value < 100)
    })
  ).toBe(true)
  await dialog.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(dialog.locator("canvas")).toHaveAttribute(
    "data-preview-page",
    "2"
  )
  await expect(
    dialog.getByRole("button", { name: "Next page", exact: true })
  ).toBeDisabled()
  await expect(
    dialog.getByRole("link", { name: "Open original" })
  ).toBeVisible()
})

test("preview errors can be retried without losing the selected document", async ({
  page,
}) => {
  const fixture = await openPreviews(page, true)
  await card(page, "Uploaded png")
    .getByRole("button", { name: "Open Uploaded png", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "Uploaded png" })
  await expect(dialog.getByRole("alert")).toContainText("could not be loaded")
  fixture.allowPreview()
  await dialog.getByRole("button", { name: "Retry preview" }).click()
  await expect(
    dialog.getByRole("img", { name: "Uploaded png", exact: true })
  ).toBeVisible()
})

test("view-only users can preview files but cannot upload to empty slots", async ({
  page,
}) => {
  const fixture = await openPreviews(page)
  await page.goto("/visual-regression/documents-banner?readOnly=1")
  await expect(
    card(page, "Bylaws").getByRole("button", {
      name: "Upload Bylaws",
      exact: true,
    })
  ).toBeDisabled()
  const readOnlySlot = card(page, "Bylaws")
  const transfer = await slotTransfer(page)
  await readOnlySlot.dispatchEvent("dragenter", { dataTransfer: transfer })
  await expect(readOnlySlot).not.toHaveAttribute("data-dragging-file")
  await readOnlySlot.dispatchEvent("drop", { dataTransfer: transfer })
  expect(fixture.generalUploadCount()).toBe(0)
  await card(page, "Uploaded png")
    .getByRole("button", { name: "Open Uploaded png", exact: true })
    .click()
  await expect(
    page
      .getByRole("dialog", { name: "Uploaded png" })
      .getByRole("img", { name: "Uploaded png", exact: true })
  ).toBeVisible()
  expect(fixture.uploads).toEqual([])
})

for (const width of [390, 1440, 2560]) {
  test(`compact cards fit ${width}px and use compact upload icons for each empty core document`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await openPreviews(page)
    const banner = page.locator(
      '[data-react-grab-owner-id="organization-documents:banner"]'
    )
    expect((await banner.boundingBox())!.width).toBeLessThanOrEqual(576)
    expect(
      (await card(page, "Uploaded png").boundingBox())!.width
    ).toBeLessThan(200)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await expect(
      card(page, "Mission, vision, and values").locator(
        "svg.tabler-icon-cloud-upload"
      )
    ).toHaveCount(1)
  })
}

for (const view of ["Grid", "List"]) {
  test(`${view} Budget and Board strategy upload independently and retain previews after reload`, async ({
    page,
  }) => {
    const fixture = await openPreviews(page)
    await page
      .getByRole("button", { name: `${view} view`, exact: true })
      .click()
    const budget = card(page, "Budget")
    const board = card(page, "Board strategy")
    await expect(budget.locator(".tabular-nums")).toHaveCount(0)
    const icon = budget.locator("svg.tabler-icon-cloud-upload")
    await expect(icon).toHaveCSS("width", "20px")
    const transfer = await slotTransfer(page)
    await budget.scrollIntoViewIfNeeded()
    await budget.dispatchEvent("dragenter", { dataTransfer: transfer })
    await expect(budget).toHaveAttribute("data-dragging-file", "true")
    await expect(board).not.toHaveAttribute("data-dragging-file")
    await budget.dispatchEvent("drop", { dataTransfer: transfer })
    await expect.poll(() => fixture.coreUploads).toEqual(["budget"])
    await expect(
      budget.getByRole("img", { name: "Budget preview" })
    ).toBeVisible()
    await expect(board).toHaveAttribute("data-document-dropzone", "true")
    const chooser = page.waitForEvent("filechooser")
    await board
      .getByRole("button", { name: "Upload Board strategy", exact: true })
      .click()
    await (
      await chooser
    ).setFiles({ name: "bylaws.png", mimeType: "image/png", buffer: IMAGE })
    await expect
      .poll(() => fixture.coreUploads)
      .toEqual(["budget", "board_strategy"])
    await expect(
      board.getByRole("img", { name: "Board strategy preview" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "bylaws.png", exact: true })
    ).toHaveCount(0)
    await page.reload()
    await budget.scrollIntoViewIfNeeded()
    await expect(
      budget.getByRole("img", { name: "Budget preview" })
    ).toBeVisible()
    await expect(budget.locator(".tabular-nums")).toHaveText("Sep 8")
    await expect(
      board.getByRole("img", { name: "Board strategy preview" })
    ).toBeVisible()
    await page.getByRole("textbox", { name: "Search documents" }).fill("Budget")
    await expect(
      budget.getByRole("img", { name: "Budget preview" })
    ).toBeVisible()
    await budget
      .getByRole("button", { name: "Open Budget", exact: true })
      .click()
    await expect(
      page
        .getByRole("dialog", { name: "Budget", exact: true })
        .getByRole("img", { name: "Budget", exact: true })
    ).toBeVisible()
    expect(fixture.generalUploadCount()).toBe(0)
  })
}

for (const theme of ["light", "dark"]) {
  test(`selection has no hover container in ${theme} mode`, async ({
    page,
  }) => {
    await openPreviews(page)
    await page.evaluate(
      (theme) =>
        document.documentElement.classList.toggle("dark", theme === "dark"),
      theme
    )
    const selection = card(page, "Uploaded png").getByRole("button", {
      name: "Select Uploaded png",
      exact: true,
    })
    await selection.hover()
    await expect(selection).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await selection.click()
    const selected = card(page, "Uploaded png").locator(
      'button[aria-pressed="true"]'
    )
    await page.mouse.move(0, 0)
    await selected.blur()
    await expect(selected).toHaveCSS("opacity", "1")
    await expect(selected).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  })
}

test("read-only core slots cannot receive dropped files", async ({ page }) => {
  const fixture = await openPreviews(page)
  await page.goto("/visual-regression/documents-banner?readOnly=1")
  const budget = card(page, "Budget")
  await expect(
    budget.getByRole("button", { name: "Upload Budget", exact: true })
  ).toBeDisabled()
  await budget.dispatchEvent("drop", { dataTransfer: await slotTransfer(page) })
  expect(fixture.coreUploads).toEqual([])
  expect(fixture.generalUploadCount()).toBe(0)
})
