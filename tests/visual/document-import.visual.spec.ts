import { readFileSync } from "node:fs"
import { expect, test, type Page } from "@playwright/test"
import { convertDocument } from "../../src/features/document-import/server/convert-document"

const DOCX = readFileSync("tests/fixtures/document-import/board-strategy.docx")

async function mockImports(page: Page) {
  const driveRequests: string[] = []
  await page.route("https://unpkg.com/react-grab@*/**", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" })
  )
  await page.route("**/api/link-preview**", (route) =>
    route.fulfill({ json: {} })
  )
  await page.route("**/api/document-import", async (route) => {
    try {
      const request = route.request()
      if (request.headers()["content-type"]?.includes("application/json")) {
        driveRequests.push(request.postDataJSON().driveFileId)
        const document = await convertDocument({
          name: "Board plan.docx",
          bytes: DOCX,
        })
        return route.fulfill({
          json: {
            document: {
              ...document,
              sourceUrl:
                "https://docs.google.com/document/d/selected-file-1/edit",
            },
          },
        })
      }
      const form = await new Request(request.url(), {
        method: "POST",
        headers: { "content-type": request.headers()["content-type"] },
        body: Uint8Array.from(request.postDataBuffer()!).buffer,
      }).formData()
      const file = form.get("file") as File
      const document = await convertDocument({
        name: file.name,
        bytes: Buffer.from(await file.arrayBuffer()),
      })
      return route.fulfill({ json: { document } })
    } catch (error) {
      return route.fulfill({
        status: 400,
        json: {
          error: error instanceof Error ? error.message : "Import failed",
        },
      })
    }
  })
  return { driveRequests }
}
async function upload(page: Page, name: string, buffer: Buffer) {
  const dialog = page.getByRole("dialog")
  const chooser = page.waitForEvent("filechooser")
  await dialog.getByRole("button", { name: "Upload file", exact: true }).click()
  await (
    await chooser
  ).setFiles({ name, buffer, mimeType: "application/octet-stream" })
  await expect(dialog.getByLabel("Import preview")).toBeVisible()
  return dialog
}

for (const width of [390, 1440]) {
  test(`Word import previews, appends, and persists editable text at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockImports(page)
    await page.goto("/visual-regression/document-import")
    const editor = page.locator('[contenteditable="true"]')
    await expect(editor).toContainText("Existing board notes.")
    await page
      .getByRole("button", { name: "Import document", exact: true })
      .click()
    const dialog = await upload(page, "board-strategy.docx", DOCX)
    await expect(dialog).toHaveScreenshot(`document-import-${width}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.03,
    })
    await expect(editor).not.toContainText("Recruit three")
    await expect(
      dialog.getByLabel("Import preview").locator("table")
    ).toBeVisible()
    await dialog.getByRole("button", { name: "Add to document" }).click()
    await expect(editor).toContainText("Existing board notes.")
    await expect(editor.locator("strong")).toHaveText(
      "Recruit three board members."
    )
    await expect(editor.locator("table")).toBeVisible()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+End")
    await page.keyboard.type(" Updated")
    await expect(editor).toContainText("Updated")
    await page.reload()
    await expect(editor).toContainText("Updated")
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("Markdown replacement is explicit and cancel leaves the original unchanged", async ({
  page,
}) => {
  await mockImports(page)
  await page.goto("/visual-regression/document-import")
  const editor = page.locator('[contenteditable="true"]')
  await page
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  let dialog = await upload(
    page,
    "strategy.md",
    Buffer.from("# New strategy\n\n- Recruit\n- Train")
  )
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(editor).toContainText("Existing board notes.")
  await page
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  dialog = await upload(
    page,
    "strategy.md",
    Buffer.from("# New strategy\n\n- Recruit\n- Train")
  )
  await dialog.getByRole("button", { name: "Replace document" }).click()
  await expect(editor).not.toContainText("Existing board notes.")
  await expect(editor.locator("h1")).toHaveText("New strategy")
  await expect(editor.locator("li")).toHaveCount(2)
})

test("import preserves an image-only document when adding text", async ({
  page,
}) => {
  await mockImports(page)
  await page.addInitScript(() => {
    localStorage.setItem(
      "document-import-visual-content",
      '<p><img src="/favicon.ico" alt="Existing diagram"></p>'
    )
  })
  await page.goto("/visual-regression/document-import")
  const editor = page.locator('[contenteditable="true"]')
  await expect(editor.locator("img")).toHaveCount(1)
  await page
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  const dialog = await upload(page, "notes.md", Buffer.from("# Diagram notes"))
  await expect(
    dialog.getByRole("button", { name: "Replace document" })
  ).toBeVisible()
  await dialog.getByRole("button", { name: "Add to document" }).click()
  await expect(editor.locator("img")).toHaveCount(1)
  await expect(editor).toContainText("Diagram notes")
})

test("formatted paste keeps supported styles after reload", async ({
  page,
}) => {
  await mockImports(page)
  await page.goto("/visual-regression/document-import")
  const editor = page.locator('[contenteditable="true"]')
  await expect(editor).toContainText("Existing board notes.")
  await editor.click()
  await page.keyboard.press("ControlOrMeta+A")
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData(
      "text/html",
      '<h2>Board plan</h2><p style="text-align:center"><span style="color:rgb(180, 20, 30);font-size:18px;font-family:Georgia"><strong>Styled paste</strong></span></p><ul><li>Recruit</li></ul><script>window.badPaste = true</script>'
    )
    clipboardData.setData("text/plain", "Board plan\nStyled paste\nRecruit")
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true,
      })
    )
  })
  await expect(editor.locator("strong")).toHaveText("Styled paste")
  await expect(editor.locator('span[style*="font-size"]')).toHaveCSS(
    "font-size",
    "18px"
  )
  await expect(editor.locator('span[style*="color"]')).toHaveAttribute(
    "style",
    /color: light-dark\(/
  )
  await expect(editor.locator("li")).toHaveText("Recruit")
  await page.reload()
  await expect(editor.locator('span[style*="font-size"]')).toHaveCSS(
    "font-size",
    "18px"
  )
  await expect(editor.locator("script")).toHaveCount(0)
})

test("Google import uses the selected file and retains a source link", async ({
  page,
}) => {
  const fixture = await mockImports(page)
  await page.route("**/api/integrations/google-drive/picker-token", (route) =>
    route.fulfill({
      json: {
        accessToken: "fixture-token",
        developerKey: "fixture-key",
        appId: "fixture-app",
      },
    })
  )
  await page.goto("/visual-regression/document-import")
  await page.evaluate(() => {
    class PickerBuilder {
      callback = (_data: unknown) => {}
      addView() {
        return this
      }
      setAppId() {
        return this
      }
      setDeveloperKey() {
        return this
      }
      setOAuthToken() {
        return this
      }
      enableFeature() {
        return this
      }
      setCallback(callback: (data: unknown) => void) {
        this.callback = callback
        return this
      }
      build() {
        return {
          setVisible: () =>
            this.callback({
              action: "picked",
              docs: [{ id: "selected-file-1" }],
            }),
        }
      }
    }
    Object.assign(window, {
      gapi: {},
      google: {
        picker: {
          Action: { PICKED: "picked", CANCEL: "cancel" },
          ViewId: { DOCS: "docs" },
          DocsView: class {},
          PickerBuilder,
        },
      },
    })
  })
  await page
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Google Drive", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByLabel("Import preview")).toBeVisible()
  await dialog.getByRole("button", { name: "Add to document" }).click()
  await expect(
    page
      .locator('[contenteditable="true"]')
      .getByRole("link", { name: "Google Drive source" })
  ).toHaveAttribute(
    "href",
    "https://docs.google.com/document/d/selected-file-1/edit"
  )
  expect(fixture.driveRequests).toEqual(["selected-file-1"])
})

test("Budget imports text into its document view while preserving line items", async ({
  page,
}) => {
  await mockImports(page)
  await page.goto("/visual-regression/document-import")
  await page.getByRole("button", { name: "Budget", exact: true }).click()
  await expect(page.getByRole("tab", { name: "Line items" })).toHaveAttribute(
    "data-state",
    "active"
  )
  await page
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  const dialog = await upload(
    page,
    "budget.md",
    Buffer.from("# Budget narrative\n\nFunding priorities")
  )
  await dialog
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  await expect(
    page.getByRole("tab", { name: "Document", exact: true })
  ).toHaveAttribute("data-state", "active")
  await expect(page.locator('[contenteditable="true"]')).toContainText(
    "Funding priorities"
  )
  await page.getByRole("tab", { name: "Line items" }).click()
  await expect(
    page.getByRole("button", { name: "Add line item" })
  ).toBeVisible()
})

test("a core card imports into its matching editor and non-document sections are hidden", async ({
  page,
}) => {
  await mockImports(page)
  await page.route("**/api/integrations/google-drive/**", (route) =>
    route.fulfill({ json: { connection: { connected: false }, documents: [] } })
  )
  await page.route("**/api/account/organization-document-files**", (route) =>
    route.fulfill({
      json: { files: [], quota: { usedBytes: 0, limitBytes: 5368709120 } },
    })
  )
  const saves: Array<{
    sectionId: string
    content: string
    expectedLastUpdated: string | null
  }> = []
  await page.route("**/visual-regression/documents-banner", async (route) => {
    if (!route.request().headers()["next-action"]) return route.fallback()
    const input = JSON.parse(route.request().postData()!)[0]
    saves.push(input)
    const section = {
      ...input,
      id: input.sectionId,
      title: "Board strategy",
      slug: "board-strategy",
      subtitle: "",
      status: "in_progress",
      lastUpdated: "2026-09-08T22:00:00Z",
      isPublic: false,
    }
    return route.fulfill({
      contentType: "text/x-component",
      headers: { "x-action-revalidated": "[[],0,0]" },
      body: `0:{"a":"$@1","f":[],"b":"development"}\n1:${JSON.stringify({ section })}\n`,
    })
  })
  await page.goto("/visual-regression/documents-banner")
  for (const name of ["Program", "People", "Calendar", "Next Actions"])
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0
    )
  const board = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Board strategy", exact: true }),
  })
  await board.scrollIntoViewIfNeeded()
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer()
    transfer.items.add(
      new File(["# Imported board strategy\n\nRecruit members"], "board.md", {
        type: "text/markdown",
      })
    )
    return transfer
  })
  await board.dispatchEvent("drop", { dataTransfer })
  const dialog = page.getByRole("dialog", {
    name: "Import into Board strategy",
  })
  await expect(dialog.getByLabel("Import preview")).toContainText(
    "Recruit members"
  )
  expect(saves).toEqual([])
  await dialog
    .getByRole("button", { name: "Import document", exact: true })
    .click()
  await expect(board).not.toHaveAttribute("data-document-dropzone")
  await expect(board.getByLabel("Board strategy text preview")).toContainText(
    "Recruit members"
  )
  await expect(
    board.getByRole("link", { name: "Open Board strategy editor" })
  ).toHaveAttribute("href", "/roadmap/board-strategy")
  expect(saves[0]).toMatchObject({
    sectionId: "board_strategy",
    expectedLastUpdated: null,
  })
})
